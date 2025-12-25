import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { io, Socket } from 'socket.io-client';

// Options for socket
export interface SimpleSocketOptions {
  url: string;
  namespace?: string;
  auth?: Record<string, any> | (() => Promise<Record<string, any>>);
  headers?: Record<string, string> | (() => Promise<Record<string, string>>);
  params?: Record<string, string | number | boolean>;
  autoConnect?: boolean;
  transports?: Array<'websocket' | 'polling'>;
  reconnectAttempts?: number;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  backoffJitter?: number;
  autoSuspendOnBackground?: boolean;
  debug?: boolean;
  connectTimeout?: number;
}

// ---------------- Service ----------------
export class socketService<Events extends Record<string, any> = any> {
  private socket: Socket | null = null;
  private url: string;
  private namespace?: string;
  private options: Required<SimpleSocketOptions>;
  private reconnectAttempts = 0;
  private manualDisconnect = false;
  private isConnecting = false;
  private appState: AppStateStatus = AppState.currentState;
  private networkConnected = true;
  private listeners = new Map<keyof Events, Set<(data: any) => void>>();
  private appStateSubscription?: { remove: () => void };
  private netInfoUnsubscribe?: () => void;

  constructor(opts: SimpleSocketOptions) {
    this.options = {
      transports: ['websocket'],
      autoConnect: true,
      reconnectAttempts: 10,
      reconnectDelayMs: 1000,
      maxReconnectDelayMs: 30000,
      backoffJitter: 0.2,
      autoSuspendOnBackground: true,
      debug: false,
      namespace: '',
      auth: {},
      headers: {},
      params: {},
      connectTimeout: 10000,
      ...opts,
    };

    this.url = opts.url;
    this.namespace = opts.namespace;

    this.setupAppStateListener();
    this.setupNetworkListener();

    if (this.options.autoConnect) this.connect().catch(() => { });
  }

  // ---------------- Core API ----------------

  public async connect() {
    if (this.socket && this.socket.connected) return;
    if (this.isConnecting) return;
    if (this.options.autoSuspendOnBackground && this.appState === 'background') return;
    if (!this.networkConnected) {
      this.log('Network offline, skipping connect');
      return;
    }

    this.isConnecting = true;
    this.manualDisconnect = false;

    try {
      const authPayload = await this.resolveAuth();
      const headers = await this.resolveHeaders();
      const fullUrl = this.namespace
        ? `${this.url}${this.namespace.startsWith('/') ? this.namespace : '/' + this.namespace}`
        : this.url;

      this.log('Connecting to:', fullUrl);

      this.socket = io(fullUrl, {
        autoConnect: false,
        transports: this.options.transports,
        auth: authPayload || undefined,
        reconnection: false,
        extraHeaders: headers,
        query: this.options.params,
      });

      this.registerCoreHandlers();
      this.socket.connect();

      await this.waitForConnect(this.options.connectTimeout);
      this.reconnectAttempts = 0;
      this.log('Socket connected ✅');
      this.attachAllListeners();
    } catch (err) {
      this.log('Connect error:', err);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(manual = true) {
    this.manualDisconnect = manual;
    if (!this.socket) return;
    try {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.log('Socket disconnected');
    } catch (err) {
      this.log('Disconnect error:', err);
    }
  }

  public async forceReconnect() {
    await this.disconnect(false);
    await this.connect();
  }

  /** Emit an event with typed payload */
  public emit<K extends keyof Events>(event: K, data: Events[K]) {
    if (!this.socket || !this.socket.connected) {
      this.log(`❌ Emit failed: socket not connected (${String(event)})`);
      return;
    }

    try {
      this.socket.emit(event as string, data);
      this.log('Emit:', event, data);
    } catch (err) {
      this.log('Emit error:', err);
    }
  }

  /** Listen to a typed event */
  public on<K extends keyof Events>(event: K, fn: (data: Events[K]) => void) {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn);
    this.listeners.set(event, set);
    if (this.socket) this.socket.on(event as string, fn);
  }

  /** Remove listener */
  public off<K extends keyof Events>(event: K, fn?: (data: Events[K]) => void) {
    const set = this.listeners.get(event);
    if (!set) return;
    if (fn) {
      set.delete(fn);
      if (this.socket) this.socket.off(event as string, fn);
    } else {
      set.clear();
      if (this.socket) this.socket.removeAllListeners(event as string);
    }
    if (set.size === 0) this.listeners.delete(event);
  }

  /** Update auth and reconnect */
  public async setAuth(auth: SimpleSocketOptions['auth']) {
    this.options.auth = auth ?? {};
    await this.forceReconnect();
  }

  public async setHeaders(headers: SimpleSocketOptions['headers']) {
    this.options.headers = headers ?? {};
    await this.forceReconnect();
  }

  private async resolveHeaders() {
    const headers = this.options.headers;
    if (!headers) return {};
    if (typeof headers === 'function') {
      try {
        return await headers();
      } catch (err) {
        this.log('Header resolve failed:', err);
        return {};
      }
    }
    return headers;
  }

  public getSocket() {
    return this.socket;
  }

  /** Clean up listeners and socket (call on unmount) */
  public destroy() {
    this.appStateSubscription?.remove();
    this.netInfoUnsubscribe?.();
    this.disconnect(true);
    this.listeners.clear();
    this.log('Socket service destroyed');
  }

  // ---------------- Internals ----------------

  private registerCoreHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.log('Connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.log('Disconnected:', reason);
      if (!this.manualDisconnect) this.scheduleReconnect();
    });

    this.socket.on('connect_error', (err: any) => {
      this.log('Connect error:', err.message || err);
      if (!this.manualDisconnect) this.scheduleReconnect();
    });
  }

  private async waitForConnect(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('No socket'));
      let done = false;

      const onConnect = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      const onError = (err: any) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err);
      };
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        reject(new Error('Connection timeout'));
      }, timeout);

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }

  private attachAllListeners() {
    if (!this.socket) return;
    for (const [event, set] of this.listeners.entries()) {
      for (const fn of set) {
        this.socket.on(event as string, fn);
      }
    }
  }

  private async resolveAuth() {
    const auth = this.options.auth;
    if (!auth) return null;
    if (typeof auth === 'function') {
      try {
        return await auth();
      } catch (err) {
        this.log('Auth resolve failed:', err);
        return null;
      }
    }
    return auth;
  }

  private scheduleReconnect() {
    if (this.manualDisconnect) return;
    if (!this.networkConnected) {
      this.log('Network offline, waiting...');
      return;
    }
    if (this.options.autoSuspendOnBackground && this.appState === 'background') {
      this.log('App backgrounded, skipping reconnect');
      return;
    }

    const maxAttempts = this.options.reconnectAttempts;
    if (this.reconnectAttempts >= maxAttempts) {
      this.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const base = this.options.reconnectDelayMs;
    const max = this.options.maxReconnectDelayMs;
    const delay = Math.min(base * Math.pow(2, this.reconnectAttempts - 1), max);
    const jitter = this.options.backoffJitter * delay * (Math.random() * 2 - 1);
    const finalDelay = Math.max(500, Math.round(delay + jitter));

    this.log(`Reconnecting in ${finalDelay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => { });
    }, finalDelay);
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (next) => {
      const prev = this.appState;
      this.appState = next;
      if (this.options.autoSuspendOnBackground) {
        if (prev === 'active' && next === 'background') {
          this.log('App backgrounded → disconnecting socket');
          this.disconnect(false);
        } else if (prev === 'background' && next === 'active') {
          this.log('App foregrounded → reconnecting socket');
          this.connect().catch(() => { });
        }
      }
    });
  }

  private setupNetworkListener() {
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected && !!state.isInternetReachable;
      if (connected !== this.networkConnected) {
        this.networkConnected = connected;
        this.log('Network status changed:', connected);
        if (connected) this.scheduleReconnect();
      }
    });
  }

  private log(...args: any[]) {
    if (this.options.debug) console.log('[SimpleSocket]', ...args);
  }
}
