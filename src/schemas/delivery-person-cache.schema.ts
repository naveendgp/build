import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type DeliveryPersonCacheDocument = HydratedDocument<DeliveryPersonCache>;

// Schema for GeoPointWithTime (current_location)
const GeoPointWithTimeSchema = new MongooseSchema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    last_updated: { type: Date },
  },
  { _id: false },
);

// Schema for location objects (from_location, to_location)
const LocationSchema = new MongooseSchema(
  {
    label: { type: String },
    address_line1: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    is_default: { type: Boolean },
    landmark: { type: String },
    _id: { type: String },
    distance: { type: Number },
    distanceUnit: { type: String },
    distanceFormatted: { type: String },
  },
  { _id: false, strict: false },
);

// Schema for cached order details
const CachedOrderDetailsSchema = new MongooseSchema(
  {
    _id: { type: Types.ObjectId, required: true },
    driver_name: { type: String, required: true },
    phone: { type: String, required: true },
    current_location: { type: GeoPointWithTimeSchema, required: true },
    from_location: { type: LocationSchema, required: true },
    to_location: { type: LocationSchema, required: true },
    from_eta: { type: String, required: true },
    to_eta: { type: String, required: true },
    order_duration: { type: Date, required: true },
    order_accept_endtime: { type: Date, required: true },
  },
  { _id: false, strict: true }, // strict: true ensures only these fields are allowed
);

// Schema for cached order
const CachedOrderSchema = new MongooseSchema(
  {
    order_id: { type: Types.ObjectId, required: true },
    type: { type: String, default: 'order-list', enum: ['order-list'] },
    details: { type: CachedOrderDetailsSchema, required: true },
  },
  { _id: true, strict: true },
);

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'delivery_person_cache',
  strict: true, // Only allow defined fields
})
export class DeliveryPersonCache {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  delivery_person_id: Types.ObjectId;

  @Prop({ type: [CachedOrderSchema], default: [] })
  cached_orders: Array<{
    order_id: Types.ObjectId;
    type: string;
    details: {
      _id: Types.ObjectId;
      driver_name: string;
      phone: string;
      current_location: {
        latitude: number;
        longitude: number;
        last_updated?: Date;
      };
      from_location: any;
      to_location: any;
      from_eta: string;
      to_eta: string;
      order_duration: Date;
      order_accept_endtime: Date;
    };
  }>;

  @Prop({ type: Date, required: true, index: true })
  expires_at: Date;

  @Prop({ type: Date, index: true })
  check_time?: Date;

  created_at?: Date;
  updated_at?: Date;
}

export const DeliveryPersonCacheSchema =
  SchemaFactory.createForClass(DeliveryPersonCache);

// Add pre-save hook to validate and clean structure
DeliveryPersonCacheSchema.pre('save', function (next) {
  if (this.cached_orders && Array.isArray(this.cached_orders)) {
    this.cached_orders = this.cached_orders
      .map((order: any) => {
        // Validate order structure
        if (!order || !order.order_id) {
          console.warn('Pre-save hook: Skipping invalid order: missing order_id', order);
          return null;
        }

        // Validate details exists and is an object
        if (!order.details || typeof order.details !== 'object') {
          console.warn('Pre-save hook: Skipping invalid order: missing or invalid details', order.order_id);
          return null;
        }

        const details = order.details;
        if (details.order ) {
          const deliveryData = details;
          order.details = {
            _id: deliveryData._id,
            driver_name: deliveryData.driver_name,
            phone: deliveryData.phone,
            current_location: deliveryData.current_location,
            from_location: deliveryData.from_location,
            to_location: deliveryData.to_location,
            from_eta: deliveryData.from_eta,
            to_eta: deliveryData.to_eta,
            order_duration: deliveryData.order_duration,
            order_accept_endtime:
              deliveryData.order_accept_endtime ,
          };
        } else {
          // Validate required fields exist
          if (!details._id || !details.driver_name || !details.phone || !details.current_location) {
            console.warn('Pre-save hook: Skipping invalid order: missing required fields', order.order_id);
            return null;
          }

          // Clean details to only include allowed fields
          order.details = {
            _id: details._id,
            driver_name: details.driver_name,
            phone: details.phone,
            current_location: details.current_location,
            from_location: details.from_location,
            to_location: details.to_location,
            from_eta: details.from_eta,
            to_eta: details.to_eta,
            order_duration: details.order_duration,
            order_accept_endtime: details.order_accept_endtime,
          };
        }
        return {
          order_id: order.order_id,
          type: order.type || 'order-list',
          details: order.details,
        };
      })
      .filter((order: any) => order !== null);
  }
  next();
});

DeliveryPersonCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

