use spacetimedb::{ReducerContext, Table};

#[derive(Clone)]
#[spacetimedb::table(accessor = user, public)]
pub struct User {
    #[primary_key]
    pub id: String,
    #[unique]
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    #[unique]
    pub email: String,
    pub phone: String,
    pub timezone: String,
    pub password_hash: String,
    pub role: String,
    pub admin: bool,
    pub disabled: bool,
    pub browser_notifications: bool,
    pub in_app_notifications: bool,
    pub reservation_created: bool,
    pub reservation_canceled: bool,
    pub slot_changed: bool,
    pub account_changed: bool,
    pub pool_assigned: bool,
    pub invite_created: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
#[spacetimedb::table(accessor = pool, public)]
pub struct Pool {
    #[primary_key]
    pub id: String,
    pub name: String,
    pub topic: String,
    #[index(btree)]
    pub host_id: String,
    pub assigned_client_ids: Vec<String>,
    pub notes: String,
    pub max_reservations_per_client: u32,
    pub max_total_minutes_per_client: u32,
    pub booking_window_days: u32,
    pub minimum_notice_minutes: u32,
    pub slot_capacity: u32,
    pub allowed_durations_minutes: Vec<u32>,
    pub require_approval: bool,
    pub timezone: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
#[spacetimedb::table(accessor = slot, public)]
pub struct Slot {
    #[primary_key]
    pub id: String,
    #[index(btree)]
    pub pool_id: String,
    pub starts_at: String,
    pub ends_at: String,
    pub duration_minutes: u32,
    #[index(btree)]
    pub reserved_status: String,
    pub reserved_user_ids: Vec<String>,
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
#[spacetimedb::table(accessor = reservation, public)]
pub struct Reservation {
    #[primary_key]
    pub id: String,
    #[index(btree)]
    pub slot_id: String,
    #[index(btree)]
    pub pool_id: String,
    #[index(btree)]
    pub user_id: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
#[spacetimedb::table(accessor = invite, public)]
pub struct Invite {
    #[primary_key]
    pub id: String,
    #[unique]
    pub code: String,
    pub invite_type: String,
    #[index(btree)]
    pub created_by_user_id: String,
    #[index(btree)]
    pub pool_id: Option<String>,
    pub used_by_user_ids: Vec<String>,
    pub revoked: bool,
    pub expires_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
#[spacetimedb::table(accessor = notification, public)]
pub struct Notification {
    #[primary_key]
    pub id: String,
    #[index(btree)]
    pub user_id: String,
    pub notification_type: String,
    pub title: String,
    pub body: String,
    pub read: bool,
    pub created_at: String,
}

#[spacetimedb::table(accessor = audit_event, public)]
pub struct AuditEvent {
    #[primary_key]
    pub id: String,
    pub actor_user_id: Option<String>,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub details: String,
    pub created_at: String,
}

fn push_audit(
    ctx: &ReducerContext,
    id: String,
    actor_user_id: Option<String>,
    action: String,
    entity_type: String,
    entity_id: String,
    details: String,
    created_at: String,
) {
    ctx.db.audit_event().insert(AuditEvent {
        id,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at,
    });
}

fn push_notification(
    ctx: &ReducerContext,
    id: String,
    user_id: String,
    notification_type: String,
    title: String,
    body: String,
    created_at: String,
) {
    ctx.db.notification().insert(Notification {
        id,
        user_id,
        notification_type,
        title,
        body,
        read: false,
        created_at,
    });
}

fn is_admin(ctx: &ReducerContext, user_id: &str) -> bool {
    ctx.db.user().id().find(&user_id.to_string()).map(|user| user.admin).unwrap_or(false)
}

#[spacetimedb::reducer]
pub fn create_user(
    ctx: &ReducerContext,
    actor_user_id: String,
    id: String,
    username: String,
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    timezone: String,
    password_hash: String,
    role: String,
    admin: bool,
    disabled: bool,
    created_at: String,
    updated_at: String,
) -> Result<(), String> {
    if !actor_user_id.is_empty() && !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }
    if ctx.db.user().id().find(&id).is_some() {
        return Err("User already exists".to_string());
    }
    if ctx.db.user().iter().any(|user| user.username == username) {
        return Err("Username already exists".to_string());
    }
    if ctx.db.user().iter().any(|user| user.email == email) {
        return Err("Email already exists".to_string());
    }

    ctx.db.user().insert(User {
        id: id.clone(),
        username: username.clone(),
        first_name,
        last_name,
        email,
        phone,
        timezone,
        password_hash,
        role: if admin { "admin".to_string() } else { role },
        admin,
        disabled,
        browser_notifications: true,
        in_app_notifications: true,
        reservation_created: true,
        reservation_canceled: true,
        slot_changed: true,
        account_changed: true,
        pool_assigned: true,
        invite_created: true,
        created_at: created_at.clone(),
        updated_at,
    });

    push_audit(
        ctx,
        id,
        if actor_user_id.is_empty() { None } else { Some(actor_user_id) },
        "user_create".to_string(),
        "user".to_string(),
        username,
        "Created user".to_string(),
        created_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn signup_client(
    ctx: &ReducerContext,
    id: String,
    username: String,
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    timezone: String,
    password_hash: String,
    invite_code: String,
    created_at: String,
    updated_at: String,
) -> Result<(), String> {
    let mut invite = ctx
        .db
        .invite()
        .iter()
        .find(|invite| invite.code == invite_code)
        .ok_or_else(|| "Invite not found".to_string())?;
    if invite.revoked {
        return Err("Invite revoked".to_string());
    }
    if ctx.db.user().iter().any(|user| user.username == username) {
        return Err("Username already exists".to_string());
    }
    if ctx.db.user().iter().any(|user| user.email == email) {
        return Err("Email already exists".to_string());
    }

    ctx.db.user().insert(User {
        id: id.clone(),
        username: username.clone(),
        first_name,
        last_name,
        email,
        phone,
        timezone,
        password_hash,
        role: "client".to_string(),
        admin: false,
        disabled: false,
        browser_notifications: true,
        in_app_notifications: true,
        reservation_created: true,
        reservation_canceled: true,
        slot_changed: true,
        account_changed: true,
        pool_assigned: true,
        invite_created: true,
        created_at: created_at.clone(),
        updated_at,
    });

    let pool_id = invite.pool_id.clone();
    invite.used_by_user_ids.push(id.clone());
    ctx.db.invite().id().update(invite);

    if let Some(pool_id) = pool_id {
        if let Some(mut pool) = ctx.db.pool().id().find(&pool_id) {
            let pool_name = pool.name.clone();
            if !pool.assigned_client_ids.iter().any(|client_id| client_id == &id) {
                pool.assigned_client_ids.push(id.clone());
                pool.updated_at = created_at.clone();
                ctx.db.pool().id().update(pool);
            }
            push_notification(
                ctx,
                format!("notif-{id}"),
                id.clone(),
                "pool_assigned".to_string(),
                "Joined pool".to_string(),
                format!("You were added to {pool_name}"),
                created_at.clone(),
            );
        }
    }

    push_audit(
        ctx,
        format!("audit-{id}"),
        None,
        "signup".to_string(),
        "user".to_string(),
        id,
        format!("Signed up with invite {invite_code}"),
        created_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn create_invite(
    ctx: &ReducerContext,
    actor_user_id: String,
    id: String,
    code: String,
    invite_type: String,
    pool_id: Option<String>,
    expires_at: String,
    created_at: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }
    if ctx.db.invite().iter().any(|invite| invite.code == code) {
        return Err("Invite already exists".to_string());
    }

    ctx.db.invite().insert(Invite {
        id: id.clone(),
        code: code.clone(),
        invite_type,
        created_by_user_id: actor_user_id.clone(),
        pool_id,
        used_by_user_ids: Vec::new(),
        revoked: false,
        expires_at,
        created_at: created_at.clone(),
        updated_at,
    });

    push_audit(
        ctx,
        format!("audit-{id}"),
        Some(actor_user_id),
        "invite_create".to_string(),
        "invite".to_string(),
        code,
        "Created invite".to_string(),
        created_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn create_pool(
    ctx: &ReducerContext,
    actor_user_id: String,
    id: String,
    name: String,
    topic: String,
    host_id: String,
    assigned_client_ids: Vec<String>,
    notes: String,
    max_reservations_per_client: u32,
    max_total_minutes_per_client: u32,
    booking_window_days: u32,
    minimum_notice_minutes: u32,
    slot_capacity: u32,
    allowed_durations_minutes: Vec<u32>,
    require_approval: bool,
    timezone: String,
    created_at: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }
    if ctx.db.user().id().find(&host_id).is_none() {
        return Err("Host not found".to_string());
    }

    ctx.db.pool().insert(Pool {
        id: id.clone(),
        name: name.clone(),
        topic,
        host_id,
        assigned_client_ids,
        notes,
        max_reservations_per_client,
        max_total_minutes_per_client,
        booking_window_days,
        minimum_notice_minutes,
        slot_capacity,
        allowed_durations_minutes,
        require_approval,
        timezone,
        created_at: created_at.clone(),
        updated_at,
    });

    push_audit(
        ctx,
        format!("audit-{id}"),
        Some(actor_user_id),
        "pool_create".to_string(),
        "pool".to_string(),
        id,
        format!("Created pool {name}"),
        created_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn create_slot(
    ctx: &ReducerContext,
    actor_user_id: String,
    id: String,
    pool_id: String,
    starts_at: String,
    ends_at: String,
    duration_minutes: u32,
    notes: String,
    created_at: String,
    updated_at: String,
) -> Result<(), String> {
    let pool = ctx.db.pool().id().find(&pool_id).ok_or_else(|| "Pool not found".to_string())?;
    let actor = ctx.db.user().id().find(&actor_user_id).ok_or_else(|| "Actor not found".to_string())?;
    if !actor.admin && pool.host_id != actor.id {
        return Err("Not allowed".to_string());
    }
    if !pool.allowed_durations_minutes.is_empty() && !pool.allowed_durations_minutes.contains(&duration_minutes) {
        return Err("Duration not allowed".to_string());
    }

    ctx.db.slot().insert(Slot {
        id: id.clone(),
        pool_id: pool_id.clone(),
        starts_at,
        ends_at,
        duration_minutes,
        reserved_status: "open".to_string(),
        reserved_user_ids: Vec::new(),
        notes,
        created_at: created_at.clone(),
        updated_at,
    });

    push_audit(
        ctx,
        format!("audit-{id}"),
        Some(actor_user_id),
        "slot_create".to_string(),
        "slot".to_string(),
        id,
        format!("Created slot in {}", pool.name),
        created_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn reserve_slot(
    ctx: &ReducerContext,
    actor_user_id: String,
    reservation_id: String,
    slot_id: String,
    created_at: String,
    updated_at: String,
) -> Result<(), String> {
    let actor = ctx.db.user().id().find(&actor_user_id).ok_or_else(|| "User not found".to_string())?;
    let slot = ctx.db.slot().id().find(&slot_id).ok_or_else(|| "Slot not found".to_string())?;
    let pool = ctx.db.pool().id().find(&slot.pool_id).ok_or_else(|| "Pool not found".to_string())?;

    if slot.reserved_status != "open" {
        return Err("Slot not open".to_string());
    }
    if !actor.admin && pool.host_id != actor.id && !pool.assigned_client_ids.iter().any(|client_id| client_id == &actor.id) {
        return Err("Not allowed".to_string());
    }
    let user_reservation_count = ctx.db.reservation().user_id().filter(&actor_user_id).count() as u32;
    if pool.max_reservations_per_client > 0 && user_reservation_count >= pool.max_reservations_per_client {
        return Err("Reservation limit reached".to_string());
    }

    let mut updated_slot = slot.clone();
    updated_slot.reserved_status = "reserved".to_string();
    updated_slot.reserved_user_ids = vec![actor_user_id.clone()];
    updated_slot.updated_at = updated_at.clone();
    ctx.db.slot().id().update(updated_slot);

    ctx.db.reservation().insert(Reservation {
        id: reservation_id.clone(),
        slot_id: slot_id.clone(),
        pool_id: pool.id.clone(),
        user_id: actor_user_id.clone(),
        status: "reserved".to_string(),
        created_at: created_at.clone(),
        updated_at: updated_at.clone(),
    });

    push_notification(
        ctx,
        format!("notif-{reservation_id}"),
        pool.host_id.clone(),
        "reservation_created".to_string(),
        "New reservation".to_string(),
        format!("{} reserved a slot in {}", actor.username, pool.name),
        created_at.clone(),
    );
    push_audit(
        ctx,
        format!("audit-{reservation_id}"),
        Some(actor_user_id),
        "reservation_create".to_string(),
        "reservation".to_string(),
        slot_id,
        format!("Reserved slot {}", pool.name),
        created_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn cancel_reservation(
    ctx: &ReducerContext,
    actor_user_id: String,
    slot_id: String,
    updated_at: String,
) -> Result<(), String> {
    let actor = ctx.db.user().id().find(&actor_user_id).ok_or_else(|| "User not found".to_string())?;
    let mut slot = match ctx.db.slot().id().find(&slot_id) {
        Some(slot) => slot,
        None => return Ok(()),
    };
    let reservation = match ctx.db.reservation().slot_id().filter(&slot_id).find(|reservation| reservation.status == "reserved" && reservation.user_id == actor_user_id) {
        Some(reservation) => reservation,
        None => return Ok(()),
    };

    if actor.id != reservation.user_id && !actor.admin {
        return Err("Not allowed".to_string());
    }

    let mut updated_reservation = reservation.clone();
    updated_reservation.status = "canceled".to_string();
    updated_reservation.updated_at = updated_at.clone();
    ctx.db.reservation().id().update(updated_reservation);

    slot.reserved_status = "open".to_string();
    slot.reserved_user_ids.clear();
    slot.updated_at = updated_at.clone();
    ctx.db.slot().id().update(slot);

    push_audit(
        ctx,
        format!("audit-{}-{}", reservation.id.clone(), updated_at.clone()),
        Some(actor_user_id),
        "reservation_cancel".to_string(),
        "reservation".to_string(),
        reservation.id.clone(),
        "Canceled reservation".to_string(),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn toggle_user_admin(
    ctx: &ReducerContext,
    actor_user_id: String,
    target_user_id: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }
    if actor_user_id == target_user_id {
        return Err("You cannot change your own admin status".to_string());
    }
    let mut user = ctx.db.user().id().find(&target_user_id).ok_or_else(|| "User not found".to_string())?;
    user.admin = !user.admin;
    user.role = if user.admin { "admin".to_string() } else { "client".to_string() };
    user.updated_at = updated_at.clone();
    ctx.db.user().id().update(user);

    push_audit(
        ctx,
        format!("audit-{}-{}", target_user_id, updated_at.clone()),
        Some(actor_user_id),
        "role_change".to_string(),
        "user".to_string(),
        target_user_id,
        "Toggled admin".to_string(),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn disable_user(
    ctx: &ReducerContext,
    actor_user_id: String,
    target_user_id: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }
    if actor_user_id == target_user_id {
        return Err("You cannot disable your own account".to_string());
    }
    let mut user = ctx.db.user().id().find(&target_user_id).ok_or_else(|| "User not found".to_string())?;
    user.disabled = !user.disabled;
    user.updated_at = updated_at.clone();
    ctx.db.user().id().update(user);

    push_audit(
        ctx,
        format!("audit-{}-{}", target_user_id, updated_at.clone()),
        Some(actor_user_id),
        "user_disable_toggle".to_string(),
        "user".to_string(),
        target_user_id,
        "Toggled disabled state".to_string(),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn change_password(
    ctx: &ReducerContext,
    actor_user_id: String,
    user_id: String,
    password_hash: String,
    updated_at: String,
) -> Result<(), String> {
    let mut user = ctx.db.user().id().find(&user_id).ok_or_else(|| "User not found".to_string())?;
    if actor_user_id != user_id && !is_admin(ctx, &actor_user_id) {
        return Err("Not allowed".to_string());
    }
    user.password_hash = password_hash;
    user.updated_at = updated_at.clone();
    ctx.db.user().id().update(user);

    push_audit(
        ctx,
        format!("audit-{}-{}", user_id, updated_at.clone()),
        Some(actor_user_id),
        "password_change".to_string(),
        "user".to_string(),
        user_id,
        "Password changed".to_string(),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn delete_user(
    ctx: &ReducerContext,
    actor_user_id: String,
    target_user_id: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }
    if actor_user_id == target_user_id {
        return Err("You cannot delete your own account".to_string());
    }

    let target = ctx.db.user().id().find(&target_user_id).ok_or_else(|| "User not found".to_string())?;

    let hosted_pool_ids: Vec<String> = ctx
        .db
        .pool()
        .iter()
        .filter(|pool| pool.host_id == target_user_id)
        .map(|pool| pool.id)
        .collect();
    let mut hosted_pool_ids = hosted_pool_ids;
    hosted_pool_ids.sort();
    hosted_pool_ids.dedup();

    let hosted_slot_ids: Vec<String> = ctx
        .db
        .slot()
        .iter()
        .filter(|slot| hosted_pool_ids.iter().any(|pool_id| pool_id == &slot.pool_id))
        .map(|slot| slot.id)
        .collect();

    for pool_id in hosted_pool_ids.clone() {
        let slot_ids: Vec<String> = ctx
            .db
            .slot()
            .iter()
            .filter(|slot| slot.pool_id == pool_id)
            .map(|slot| slot.id)
            .collect();

        for slot_id in slot_ids.clone() {
            let reservation_ids: Vec<String> = ctx
                .db
                .reservation()
                .iter()
                .filter(|reservation| reservation.slot_id == slot_id)
                .map(|reservation| reservation.id)
                .collect();
            for reservation_id in reservation_ids {
                ctx.db.reservation().id().delete(&reservation_id);
            }
            ctx.db.slot().id().delete(&slot_id);
        }

        let invite_ids: Vec<String> = ctx
            .db
            .invite()
            .iter()
            .filter(|invite| invite.pool_id.as_deref() == Some(&pool_id))
            .map(|invite| invite.id)
            .collect();
        for invite_id in invite_ids {
            ctx.db.invite().id().delete(&invite_id);
        }

        ctx.db.pool().id().delete(&pool_id);
    }

    let mut pools_to_update = Vec::new();
    for pool in ctx.db.pool().iter() {
        if pool.assigned_client_ids.iter().any(|client_id| client_id == &target_user_id) {
            pools_to_update.push(pool);
        }
    }
    for mut pool in pools_to_update {
        pool.assigned_client_ids.retain(|client_id| client_id != &target_user_id);
        pool.updated_at = updated_at.clone();
        ctx.db.pool().id().update(pool);
    }

    let reservation_ids: Vec<String> = ctx
        .db
        .reservation()
        .iter()
        .filter(|reservation| reservation.user_id == target_user_id && !hosted_slot_ids.iter().any(|slot_id| slot_id == &reservation.slot_id))
        .map(|reservation| reservation.id)
        .collect();
    for reservation_id in reservation_ids {
        ctx.db.reservation().id().delete(&reservation_id);
    }

    let mut invite_ids: Vec<String> = ctx
        .db
        .invite()
        .iter()
        .filter(|invite| invite.created_by_user_id == target_user_id && !hosted_pool_ids.iter().any(|pool_id| invite.pool_id.as_deref() == Some(pool_id.as_str())))
        .map(|invite| invite.id)
        .collect();
    invite_ids.sort();
    invite_ids.dedup();
    for invite_id in invite_ids {
        ctx.db.invite().id().delete(&invite_id);
    }

    let notification_ids: Vec<String> = ctx
        .db
        .notification()
        .iter()
        .filter(|notification| notification.user_id == target_user_id)
        .map(|notification| notification.id)
        .collect();
    for notification_id in notification_ids {
        ctx.db.notification().id().delete(&notification_id);
    }

    ctx.db.user().id().delete(&target_user_id);

    push_audit(
        ctx,
        format!("audit-delete-user-{}-{}", target_user_id, updated_at.clone()),
        Some(actor_user_id),
        "user_delete".to_string(),
        "user".to_string(),
        target_user_id,
        format!("Deleted user {}", target.username),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn delete_invite(
    ctx: &ReducerContext,
    actor_user_id: String,
    invite_id: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }

    let invite = ctx.db.invite().id().find(&invite_id).ok_or_else(|| "Invite not found".to_string())?;
    ctx.db.invite().id().delete(&invite_id);

    push_audit(
        ctx,
        format!("audit-delete-invite-{}-{}", invite_id, updated_at.clone()),
        Some(actor_user_id),
        "invite_delete".to_string(),
        "invite".to_string(),
        invite_id,
        format!("Deleted invite {}", invite.code),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn delete_pool(
    ctx: &ReducerContext,
    actor_user_id: String,
    pool_id: String,
    updated_at: String,
) -> Result<(), String> {
    if !is_admin(ctx, &actor_user_id) {
        return Err("Admin required".to_string());
    }

    let pool = ctx.db.pool().id().find(&pool_id).ok_or_else(|| "Pool not found".to_string())?;

    let slot_ids: Vec<String> = ctx
        .db
        .slot()
        .iter()
        .filter(|slot| slot.pool_id == pool_id)
        .map(|slot| slot.id)
        .collect();
    for slot_id in slot_ids {
        let reservation_ids: Vec<String> = ctx
            .db
            .reservation()
            .iter()
            .filter(|reservation| reservation.slot_id == slot_id)
            .map(|reservation| reservation.id)
            .collect();
        for reservation_id in reservation_ids {
            ctx.db.reservation().id().delete(&reservation_id);
        }
        ctx.db.slot().id().delete(&slot_id);
    }

    let invite_ids: Vec<String> = ctx
        .db
        .invite()
        .iter()
        .filter(|invite| invite.pool_id.as_deref() == Some(&pool_id))
        .map(|invite| invite.id)
        .collect();
    for invite_id in invite_ids {
        ctx.db.invite().id().delete(&invite_id);
    }

    ctx.db.pool().id().delete(&pool_id);

    push_audit(
        ctx,
        format!("audit-delete-pool-{}-{}", pool_id, updated_at.clone()),
        Some(actor_user_id),
        "pool_delete".to_string(),
        "pool".to_string(),
        pool_id,
        format!("Deleted pool {}", pool.name),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn delete_slot(
    ctx: &ReducerContext,
    actor_user_id: String,
    slot_id: String,
    updated_at: String,
) -> Result<(), String> {
    let actor = ctx.db.user().id().find(&actor_user_id).ok_or_else(|| "User not found".to_string())?;
    let slot = ctx.db.slot().id().find(&slot_id).ok_or_else(|| "Slot not found".to_string())?;
    let pool = ctx.db.pool().id().find(&slot.pool_id).ok_or_else(|| "Pool not found".to_string())?;

    if !actor.admin && pool.host_id != actor.id {
        return Err("Not allowed".to_string());
    }

    let reservation_ids: Vec<String> = ctx
        .db
        .reservation()
        .iter()
        .filter(|reservation| reservation.slot_id == slot_id)
        .map(|reservation| reservation.id)
        .collect();
    for reservation_id in reservation_ids {
        ctx.db.reservation().id().delete(&reservation_id);
    }

    ctx.db.slot().id().delete(&slot_id);

    push_audit(
        ctx,
        format!("audit-delete-slot-{}-{}", slot_id, updated_at.clone()),
        Some(actor_user_id),
        "slot_delete".to_string(),
        "slot".to_string(),
        slot_id,
        format!("Deleted slot in {}", pool.name),
        updated_at,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn record_login(
    ctx: &ReducerContext,
    actor_user_id: String,
    details: String,
    created_at: String,
) {
    push_audit(
        ctx,
        format!("audit-login-{actor_user_id}-{created_at}"),
        Some(actor_user_id),
        "login".to_string(),
        "session".to_string(),
        String::new(),
        details,
        created_at,
    );
}
