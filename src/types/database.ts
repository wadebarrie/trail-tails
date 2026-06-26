export type UserRole = "admin" | "driver";
export type ExceptionType = "skip_date" | "vacation" | "pause";
export type HikeStatus = "planned" | "in_progress" | "completed";
export type StopType = "pickup" | "dropoff";
export type StopStatus =
  | "scheduled"
  | "en_route"
  | "arrived"
  | "picked_up"
  | "dropped_off"
  | "skipped"
  | "cancelled";
export type CommandType =
  | "skip_tomorrow"
  | "skip_weekday"
  | "skip_date"
  | "vacation"
  | "pause"
  | "resume"
  | "help"
  | "unknown";
export type RequestStatus = "pending" | "approved" | "declined";
export type SmsDirection = "inbound" | "outbound";
export type NotificationType =
  | "night_before"
  | "en_route"
  | "arrived"
  | "picked_up"
  | "dropped_off"
  | "request_received"
  | "request_approved"
  | "request_declined"
  | "help";

export interface Profile {
  id: string;
  company_id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  can_drive: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  timezone: string;
  default_pickup_window_start: string | null;
  default_pickup_window_end: string | null;
  default_hike_rate_cents: number | null;
  twilio_phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  company_id: string;
  name: string;
  sort_order: number;
  default_driver_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteScheduleDay {
  id: string;
  route_id: string;
  day_of_week: number;
  created_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  owner_name: string;
  phone: string;
  secondary_owner_name: string | null;
  secondary_phone: string | null;
  email: string | null;
  address: string;
  address_lat: number | null;
  address_lng: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dog {
  id: string;
  company_id: string;
  customer_id: string;
  route_id: string | null;
  name: string;
  breed: string | null;
  notes: string | null;
  is_active: boolean;
  pickup_window_start: string;
  pickup_window_end: string;
  route_sort_order: number;
  hike_rate_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface DogScheduleDay {
  id: string;
  dog_id: string;
  day_of_week: number;
  created_at: string;
}

export interface ScheduleException {
  id: string;
  dog_id: string;
  exception_type: ExceptionType;
  start_date: string;
  end_date: string | null;
  reason: string | null;
  pending_request_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Hike {
  id: string;
  company_id: string;
  route_id: string;
  date: string;
  driver_id: string | null;
  status: HikeStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  hike_id: string;
  dog_id: string;
  stop_type: StopType;
  status: StopStatus;
  window_start: string;
  window_end: string;
  en_route_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  eta_minutes: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PendingRequest {
  id: string;
  company_id: string;
  customer_id: string;
  raw_body: string;
  command_type: CommandType;
  parsed_payload: Record<string, unknown>;
  status: RequestStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  admin_notes: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface SmsMessage {
  id: string;
  company_id: string;
  customer_id: string | null;
  direction: SmsDirection;
  from_number: string;
  to_number: string;
  body: string;
  twilio_sid: string | null;
  status: string;
  error_message: string | null;
  pending_request_id: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  company_id: string;
  customer_id: string | null;
  dog_id: string | null;
  stop_id: string | null;
  notification_type: NotificationType;
  channel: string;
  body: string;
  status: string;
  error_message: string | null;
  sms_message_id: string | null;
  created_at: string;
}

export interface SystemLog {
  id: string;
  company_id: string | null;
  level: string;
  category: string;
  message: string;
  context: Record<string, unknown>;
  created_at: string;
}

type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
};

export interface Database {
  public: {
    Tables: {
      companies: TableDef<Company>;
      routes: TableDef<Route>;
      profiles: TableDef<Profile>;
      customers: TableDef<Customer>;
      dogs: TableDef<Dog>;
      dog_schedule_days: TableDef<DogScheduleDay>;
      schedule_exceptions: TableDef<ScheduleException>;
      hikes: TableDef<Hike>;
      stops: TableDef<Stop>;
      pending_requests: TableDef<PendingRequest>;
      sms_messages: TableDef<SmsMessage>;
      notification_log: TableDef<NotificationLog>;
      system_logs: TableDef<SystemLog>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      stop_type: StopType;
      stop_status: StopStatus;
      exception_type: ExceptionType;
      command_type: CommandType;
      request_status: RequestStatus;
      sms_direction: SmsDirection;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
