import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import GoogleMaps
import os.log
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    GMSServices.provideAPIKey("AIzaSyDVlpYuw_2TA2c8gETZnSXyEiEvYXvYTzU")
    FirebaseApp.configure()

    // ✅ Set up Firebase Messaging delegate
    Messaging.messaging().delegate = self
    
    // ✅ Set up notification center delegate
    UNUserNotificationCenter.current().delegate = self

    // ✅ Request authorization and register for remote notifications
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if let error = error {
        os_log("Notification permission error: %@", log: .default, type: .error, error.localizedDescription)
        return
      }

      if granted {
        DispatchQueue.main.async {
          UIApplication.shared.registerForRemoteNotifications()
        }
      }
    }
    os_log("AppDelegate: didFinishLaunchingWithOptions called", log: .default, type: .info)

    let delegate: ReactNativeDelegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "LaundryUserApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // ✅ Handle remote notifications in background
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let userInfo = notification.request.content.userInfo
    
    os_log("Foreground notification received: %@", log: .default, type: .info, userInfo)
    
    // ✅ Handle foreground notification - display even if app is open
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .sound, .badge])
    } else {
      completionHandler([.alert, .sound, .badge])
    }
  }
  
  // ✅ Handle notification tap
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    
    os_log("Notification tapped: %@", log: .default, type: .info, userInfo)
    
    // ✅ Handle notification tap - send to React Native bridge
    if let aps = userInfo["aps"] as? [String: Any] {
      NotificationCenter.default.post(name: NSNotification.Name("NotificationTapped"), object: aps)
    }
    
    completionHandler()
  }
  
  // ✅ Handle FCM token refresh
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    if let token = fcmToken {
      os_log("FCM Token: %@", log: .default, type: .info, token)
      
      // ✅ Send token to React Native
      NotificationCenter.default.post(
        name: NSNotification.Name("FCMTokenReceived"),
        object: nil,
        userInfo: ["token": token]
      )
    }
  }

  // ✅ APNs device token received - forward to Firebase
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Set APNs token for FCM
    Messaging.messaging().apnsToken = deviceToken

    let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    os_log("APNs device token: %@", log: .default, type: .info, tokenString)

    NotificationCenter.default.post(name: NSNotification.Name("APNSTokenReceived"), object: nil, userInfo: ["token": tokenString])
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    os_log("Failed to register for remote notifications: %@", log: .default, type: .error, error.localizedDescription)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
