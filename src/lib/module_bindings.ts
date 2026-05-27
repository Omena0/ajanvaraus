import {
  DbConnectionBuilder as __DbConnectionBuilder,
  DbConnectionImpl as __DbConnectionImpl,
  SubscriptionBuilderImpl as __SubscriptionBuilderImpl,
  convertToAccessorMap as __convertToAccessorMap,
  makeQueryBuilder as __makeQueryBuilder,
  procedures as __procedures,
  table as __table,
  reducerSchema as __reducerSchema,
  reducers as __reducers,
  schema as __schema,
  t as __t,
  type DbConnectionConfig as __DbConnectionConfig,
  type ErrorContextInterface as __ErrorContextInterface,
  type EventContextInterface as __EventContextInterface,
  type QueryBuilder as __QueryBuilder,
  type ReducerEventContextInterface as __ReducerEventContextInterface,
  type RemoteModule as __RemoteModule,
  type SubscriptionEventContextInterface as __SubscriptionEventContextInterface,
  type SubscriptionHandleImpl as __SubscriptionHandleImpl,
} from 'spacetimedb';

const __tableSchema = {
  user: __table({ name: 'user', public: true }, {
    id: __t.string().primaryKey(),
    username: __t.string().unique(),
    first_name: __t.string(),
    last_name: __t.string(),
    email: __t.string().unique(),
    phone: __t.string(),
    timezone: __t.string(),
    password_hash: __t.string(),
    role: __t.string(),
    admin: __t.bool(),
    disabled: __t.bool(),
    browser_notifications: __t.bool(),
    in_app_notifications: __t.bool(),
    reservation_created: __t.bool(),
    reservation_canceled: __t.bool(),
    slot_changed: __t.bool(),
    account_changed: __t.bool(),
    pool_assigned: __t.bool(),
    invite_created: __t.bool(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  pool: __table({ name: 'pool', public: true }, {
    id: __t.string().primaryKey(),
    name: __t.string(),
    topic: __t.string(),
    host_id: __t.string().index('btree'),
    assigned_client_ids: __t.array(__t.string()),
    notes: __t.string(),
    max_reservations_per_client: __t.u32(),
    max_total_minutes_per_client: __t.u32(),
    booking_window_days: __t.u32(),
    minimum_notice_minutes: __t.u32(),
    slot_capacity: __t.u32(),
    allowed_durations_minutes: __t.array(__t.u32()),
    require_approval: __t.bool(),
    timezone: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  slot: __table({ name: 'slot', public: true }, {
    id: __t.string().primaryKey(),
    pool_id: __t.string().index('btree'),
    starts_at: __t.string(),
    ends_at: __t.string(),
    duration_minutes: __t.u32(),
    reserved_status: __t.string().index('btree'),
    reserved_user_ids: __t.array(__t.string()),
    notes: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  reservation: __table({ name: 'reservation', public: true }, {
    id: __t.string().primaryKey(),
    slot_id: __t.string().index('btree'),
    pool_id: __t.string().index('btree'),
    user_id: __t.string().index('btree'),
    status: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  invite: __table({ name: 'invite', public: true }, {
    id: __t.string().primaryKey(),
    code: __t.string().unique(),
    invite_type: __t.string(),
    created_by_user_id: __t.string().index('btree'),
    pool_id: __t.string().optional(),
    used_by_user_ids: __t.array(__t.string()),
    revoked: __t.bool(),
    expires_at: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  notification: __table({ name: 'notification', public: true }, {
    id: __t.string().primaryKey(),
    user_id: __t.string().index('btree'),
    notification_type: __t.string(),
    title: __t.string(),
    body: __t.string(),
    read: __t.bool(),
    created_at: __t.string(),
  }),
  audit_event: __table({ name: 'audit_event', public: true }, {
    id: __t.string().primaryKey(),
    actor_user_id: __t.string().optional(),
    action: __t.string(),
    entity_type: __t.string(),
    entity_id: __t.string(),
    details: __t.string(),
    created_at: __t.string(),
  }),
};

const tablesSchema = __schema(__tableSchema);

const reducersSchema = __reducers([
  __reducerSchema('create_user', {
    actor_user_id: __t.string(),
    id: __t.string(),
    username: __t.string(),
    first_name: __t.string(),
    last_name: __t.string(),
    email: __t.string(),
    phone: __t.string(),
    timezone: __t.string(),
    password_hash: __t.string(),
    role: __t.string(),
    admin: __t.bool(),
    disabled: __t.bool(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('signup_client', {
    id: __t.string(),
    username: __t.string(),
    first_name: __t.string(),
    last_name: __t.string(),
    email: __t.string(),
    phone: __t.string(),
    timezone: __t.string(),
    password_hash: __t.string(),
    invite_code: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('create_invite', {
    actor_user_id: __t.string(),
    id: __t.string(),
    code: __t.string(),
    invite_type: __t.string(),
    pool_id: __t.string().optional(),
    expires_at: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('create_pool', {
    actor_user_id: __t.string(),
    id: __t.string(),
    name: __t.string(),
    topic: __t.string(),
    host_id: __t.string(),
    assigned_client_ids: __t.array(__t.string()),
    notes: __t.string(),
    max_reservations_per_client: __t.u32(),
    max_total_minutes_per_client: __t.u32(),
    booking_window_days: __t.u32(),
    minimum_notice_minutes: __t.u32(),
    slot_capacity: __t.u32(),
    allowed_durations_minutes: __t.array(__t.u32()),
    require_approval: __t.bool(),
    timezone: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('create_slot', {
    actor_user_id: __t.string(),
    id: __t.string(),
    pool_id: __t.string(),
    starts_at: __t.string(),
    ends_at: __t.string(),
    duration_minutes: __t.u32(),
    notes: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('reserve_slot', {
    actor_user_id: __t.string(),
    reservation_id: __t.string(),
    slot_id: __t.string(),
    created_at: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('cancel_reservation', {
    actor_user_id: __t.string(),
    slot_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('toggle_user_admin', {
    actor_user_id: __t.string(),
    target_user_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('disable_user', {
    actor_user_id: __t.string(),
    target_user_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('change_password', {
    actor_user_id: __t.string(),
    user_id: __t.string(),
    password_hash: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('delete_user', {
    actor_user_id: __t.string(),
    target_user_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('delete_invite', {
    actor_user_id: __t.string(),
    invite_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('delete_pool', {
    actor_user_id: __t.string(),
    pool_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('delete_slot', {
    actor_user_id: __t.string(),
    slot_id: __t.string(),
    updated_at: __t.string(),
  }),
  __reducerSchema('record_login', {
    actor_user_id: __t.string(),
    details: __t.string(),
    created_at: __t.string(),
  }),
]);

const proceduresSchema = __procedures();

const REMOTE_MODULE = {
  versionInfo: {
    cliVersion: '2.2.0' as const,
  },
  tables: tablesSchema.schemaType.tables,
  reducers: reducersSchema.reducersType.reducers,
  ...proceduresSchema,
} satisfies __RemoteModule<typeof tablesSchema.schemaType, typeof reducersSchema.reducersType, typeof proceduresSchema>;

export const tables: __QueryBuilder<typeof tablesSchema.schemaType> = __makeQueryBuilder(
  tablesSchema.schemaType
);

export const reducers = __convertToAccessorMap(reducersSchema.reducersType.reducers);

export type EventContext = __EventContextInterface<typeof REMOTE_MODULE>;
export type ReducerEventContext = __ReducerEventContextInterface<typeof REMOTE_MODULE>;
export type SubscriptionEventContext = __SubscriptionEventContextInterface<typeof REMOTE_MODULE>;
export type ErrorContext = __ErrorContextInterface<typeof REMOTE_MODULE>;
export type SubscriptionHandle = __SubscriptionHandleImpl<typeof REMOTE_MODULE>;

export class SubscriptionBuilder extends __SubscriptionBuilderImpl<typeof REMOTE_MODULE> {}

export class DbConnectionBuilder extends __DbConnectionBuilder<DbConnection> {}

export class DbConnection extends __DbConnectionImpl<typeof REMOTE_MODULE> {
  static builder = (): DbConnectionBuilder => {
    return new DbConnectionBuilder(REMOTE_MODULE, (config: __DbConnectionConfig<typeof REMOTE_MODULE>) => new DbConnection(config));
  };

  override subscriptionBuilder = (): SubscriptionBuilder => {
    return new SubscriptionBuilder(this);
  };
}
