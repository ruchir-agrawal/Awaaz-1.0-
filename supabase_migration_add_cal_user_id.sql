alter table businesses
add column if not exists cal_user_id text unique;
