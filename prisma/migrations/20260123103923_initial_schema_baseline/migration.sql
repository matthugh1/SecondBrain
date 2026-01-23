-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT,
    "follow_ups" TEXT,
    "last_touched" TEXT,
    "tags" TEXT,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "next_action" TEXT,
    "notes" TEXT,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "one_liner" TEXT,
    "notes" TEXT,
    "last_touched" TEXT,
    "tags" TEXT,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "due_date" TEXT,
    "start_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "priority" TEXT DEFAULT 'medium',
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "estimated_duration" INTEGER,
    "actual_duration" INTEGER,
    "recurrence_rule" TEXT,
    "parent_task_id" INTEGER,
    "project_id" INTEGER,
    "assignee_id" TEXT,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_log" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "filed_to" TEXT NOT NULL,
    "destination_name" TEXT,
    "destination_url" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Filed',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notion_record_id" TEXT,

    CONSTRAINT "inbox_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digests" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_digest_templates" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_digest_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_settings" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "confidence_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "default_project_status" TEXT NOT NULL DEFAULT 'Active',
    "default_admin_status" TEXT NOT NULL DEFAULT 'Todo',
    "learning_enabled" INTEGER NOT NULL DEFAULT 1,
    "max_learning_examples" INTEGER NOT NULL DEFAULT 5,
    "example_timeframe_days" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_categories" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "field_schema" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_prompts" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "active" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_routing" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category_key" TEXT NOT NULL,
    "destination_table" TEXT NOT NULL,
    "field_mapping" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_routing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "field_key" TEXT,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'User',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_history" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER,
    "old_data" TEXT,
    "new_data" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undone" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "action_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_audit" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "prompt" TEXT,
    "response_text" TEXT,
    "parsed_result" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_corrections" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inbox_log_id" INTEGER NOT NULL,
    "original_category" TEXT NOT NULL,
    "corrected_category" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classification_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tags" (
    "tenantId" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "item_tags_pkey" PRIMARY KEY ("tenantId","item_type","item_id","tag_id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT,
    "filters" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_usage" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "attendees" TEXT,
    "description" TEXT,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_history" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" INTEGER NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "relationship_type" TEXT NOT NULL DEFAULT 'mentioned_in',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "mention_count" INTEGER NOT NULL DEFAULT 1,
    "last_mentioned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capture_count" INTEGER NOT NULL DEFAULT 0,
    "avg_confidence" DOUBLE PRECISION,
    "most_common_category" TEXT,
    "preferred_capture_time" TEXT,
    "preferred_capture_day" TEXT,
    "correction_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "frequent_people" TEXT,
    "active_focus_areas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "snoozed_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_preferences" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "channels" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "action_type" TEXT,
    "action_target_id" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patterns" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "pattern_data" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progress_method" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_projects" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_ideas" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "idea_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_progress" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_actions" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" INTEGER,
    "parameters" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "result" TEXT,
    "error_message" TEXT,
    "rollback_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_templates" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "actions" TEXT NOT NULL,
    "parameters" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflow_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "trigger_data" TEXT,
    "executed_actions" TEXT,
    "error_message" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "request" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approved_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_steps" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_params" TEXT NOT NULL,
    "dependencies" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "error_message" TEXT,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "plan_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "last_sync" TIMESTAMP(3),
    "last_error" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "message_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "sender_name" TEXT,
    "recipient_email" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "classified_as" TEXT,
    "linked_person_id" INTEGER,
    "linked_project_id" INTEGER,
    "linked_admin_id" INTEGER,
    "attachments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "calendar_event_id" TEXT NOT NULL,
    "sync_direction" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slack_messages" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "message_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "channel_name" TEXT,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT,
    "text" TEXT NOT NULL,
    "thread_ts" TEXT,
    "captured_as" TEXT,
    "linked_item_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slack_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notion_sync" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "notion_page_id" TEXT NOT NULL,
    "notion_database_id" TEXT,
    "sync_direction" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notion_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_activities" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "action_type" TEXT,
    "target_type" TEXT,
    "target_id" INTEGER,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "user_feedback" TEXT,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_settings" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proactivity_level" TEXT NOT NULL DEFAULT 'medium',
    "approval_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "auto_approve_types" TEXT,
    "focus_areas" TEXT,
    "notification_preferences" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "destination_url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prediction_type" TEXT NOT NULL,
    "predicted_value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "context" TEXT,
    "accepted" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_notes" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "duration" INTEGER,
    "transcription" TEXT,
    "transcription_confidence" DOUBLE PRECISION,
    "transcribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "depends_on_task_id" INTEGER NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'blocks',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_templates" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" TEXT NOT NULL,
    "default_values" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_accounts" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "token_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_tenantId_idx" ON "Membership"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_tenantId_key" ON "Membership"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_tenantId_idx" ON "Invite"("tenantId");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE INDEX "people_tenantId_idx" ON "people"("tenantId");

-- CreateIndex
CREATE INDEX "people_name_idx" ON "people"("name");

-- CreateIndex
CREATE INDEX "people_archived_idx" ON "people"("archived");

-- CreateIndex
CREATE INDEX "projects_tenantId_idx" ON "projects"("tenantId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_archived_idx" ON "projects"("archived");

-- CreateIndex
CREATE INDEX "ideas_tenantId_idx" ON "ideas"("tenantId");

-- CreateIndex
CREATE INDEX "ideas_archived_idx" ON "ideas"("archived");

-- CreateIndex
CREATE INDEX "admin_tenantId_idx" ON "admin"("tenantId");

-- CreateIndex
CREATE INDEX "admin_archived_idx" ON "admin"("archived");

-- CreateIndex
CREATE INDEX "admin_status_idx" ON "admin"("status");

-- CreateIndex
CREATE INDEX "admin_priority_idx" ON "admin"("priority");

-- CreateIndex
CREATE INDEX "admin_project_id_idx" ON "admin"("project_id");

-- CreateIndex
CREATE INDEX "admin_parent_task_id_idx" ON "admin"("parent_task_id");

-- CreateIndex
CREATE INDEX "admin_due_date_idx" ON "admin"("due_date");

-- CreateIndex
CREATE INDEX "admin_start_date_idx" ON "admin"("start_date");

-- CreateIndex
CREATE INDEX "admin_completed_at_idx" ON "admin"("completed_at");

-- CreateIndex
CREATE INDEX "inbox_log_tenantId_idx" ON "inbox_log"("tenantId");

-- CreateIndex
CREATE INDEX "inbox_log_created_idx" ON "inbox_log"("created");

-- CreateIndex
CREATE INDEX "inbox_log_status_idx" ON "inbox_log"("status");

-- CreateIndex
CREATE INDEX "inbox_log_filed_to_idx" ON "inbox_log"("filed_to");

-- CreateIndex
CREATE INDEX "digests_tenantId_idx" ON "digests"("tenantId");

-- CreateIndex
CREATE INDEX "digests_type_idx" ON "digests"("type");

-- CreateIndex
CREATE INDEX "digests_created_idx" ON "digests"("created");

-- CreateIndex
CREATE INDEX "custom_digest_templates_tenantId_idx" ON "custom_digest_templates"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "rule_settings_tenantId_key" ON "rule_settings"("tenantId");

-- CreateIndex
CREATE INDEX "rule_categories_tenantId_idx" ON "rule_categories"("tenantId");

-- CreateIndex
CREATE INDEX "rule_categories_category_key_idx" ON "rule_categories"("category_key");

-- CreateIndex
CREATE INDEX "rule_categories_enabled_idx" ON "rule_categories"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "rule_categories_tenantId_category_key_key" ON "rule_categories"("tenantId", "category_key");

-- CreateIndex
CREATE INDEX "rule_prompts_tenantId_idx" ON "rule_prompts"("tenantId");

-- CreateIndex
CREATE INDEX "rule_prompts_active_idx" ON "rule_prompts"("active");

-- CreateIndex
CREATE UNIQUE INDEX "rule_prompts_tenantId_name_key" ON "rule_prompts"("tenantId", "name");

-- CreateIndex
CREATE INDEX "rule_routing_tenantId_idx" ON "rule_routing"("tenantId");

-- CreateIndex
CREATE INDEX "rule_routing_category_key_idx" ON "rule_routing"("category_key");

-- CreateIndex
CREATE UNIQUE INDEX "rule_routing_tenantId_category_key_key" ON "rule_routing"("tenantId", "category_key");

-- CreateIndex
CREATE INDEX "attachments_tenantId_item_type_item_id_idx" ON "attachments"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "comments_tenantId_item_type_item_id_idx" ON "comments"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "comments_field_key_idx" ON "comments"("field_key");

-- CreateIndex
CREATE INDEX "action_history_tenantId_item_type_item_id_idx" ON "action_history"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "action_history_timestamp_idx" ON "action_history"("timestamp");

-- CreateIndex
CREATE INDEX "action_history_undone_idx" ON "action_history"("undone");

-- CreateIndex
CREATE INDEX "classification_audit_tenantId_idx" ON "classification_audit"("tenantId");

-- CreateIndex
CREATE INDEX "classification_audit_created_idx" ON "classification_audit"("created");

-- CreateIndex
CREATE INDEX "classification_audit_status_idx" ON "classification_audit"("status");

-- CreateIndex
CREATE INDEX "classification_corrections_tenantId_idx" ON "classification_corrections"("tenantId");

-- CreateIndex
CREATE INDEX "classification_corrections_tenantId_corrected_category_idx" ON "classification_corrections"("tenantId", "corrected_category");

-- CreateIndex
CREATE INDEX "classification_corrections_created_at_idx" ON "classification_corrections"("created_at");

-- CreateIndex
CREATE INDEX "tags_tenantId_idx" ON "tags"("tenantId");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_tenantId_name_key" ON "tags"("tenantId", "name");

-- CreateIndex
CREATE INDEX "item_tags_tenantId_item_type_item_id_idx" ON "item_tags"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "item_tags_tag_id_idx" ON "item_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_tags_tenantId_item_type_item_id_tag_id_key" ON "item_tags"("tenantId", "item_type", "item_id", "tag_id");

-- CreateIndex
CREATE INDEX "saved_searches_tenantId_idx" ON "saved_searches"("tenantId");

-- CreateIndex
CREATE INDEX "saved_searches_updated_at_idx" ON "saved_searches"("updated_at");

-- CreateIndex
CREATE INDEX "token_usage_tenantId_idx" ON "token_usage"("tenantId");

-- CreateIndex
CREATE INDEX "token_usage_created_idx" ON "token_usage"("created");

-- CreateIndex
CREATE INDEX "token_usage_provider_idx" ON "token_usage"("provider");

-- CreateIndex
CREATE INDEX "token_usage_operation_type_idx" ON "token_usage"("operation_type");

-- CreateIndex
CREATE INDEX "calendar_events_tenantId_idx" ON "calendar_events"("tenantId");

-- CreateIndex
CREATE INDEX "calendar_events_start_time_idx" ON "calendar_events"("start_time");

-- CreateIndex
CREATE INDEX "calendar_events_end_time_idx" ON "calendar_events"("end_time");

-- CreateIndex
CREATE INDEX "calendar_events_tenantId_start_time_end_time_idx" ON "calendar_events"("tenantId", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "embeddings_tenantId_item_type_item_id_idx" ON "embeddings"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_tenantId_item_type_item_id_key" ON "embeddings"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "query_history_tenantId_idx" ON "query_history"("tenantId");

-- CreateIndex
CREATE INDEX "query_history_tenantId_created_at_idx" ON "query_history"("tenantId", "created_at");

-- CreateIndex
CREATE INDEX "relationships_tenantId_source_type_source_id_idx" ON "relationships"("tenantId", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "relationships_tenantId_target_type_target_id_idx" ON "relationships"("tenantId", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "relationships_tenantId_relationship_type_idx" ON "relationships"("tenantId", "relationship_type");

-- CreateIndex
CREATE INDEX "relationships_strength_idx" ON "relationships"("strength");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_tenantId_source_type_source_id_target_type_ta_key" ON "relationships"("tenantId", "source_type", "source_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "user_analytics_tenantId_userId_idx" ON "user_analytics"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_analytics_tenantId_userId_key" ON "user_analytics"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "user_profiles_tenantId_userId_idx" ON "user_profiles"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_tenantId_userId_key" ON "user_profiles"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "reminders_tenantId_userId_status_idx" ON "reminders"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "reminders_tenantId_due_date_idx" ON "reminders"("tenantId", "due_date");

-- CreateIndex
CREATE INDEX "reminders_tenantId_reminder_type_idx" ON "reminders"("tenantId", "reminder_type");

-- CreateIndex
CREATE INDEX "reminders_tenantId_item_type_item_id_idx" ON "reminders"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "reminder_preferences_tenantId_userId_idx" ON "reminder_preferences"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_preferences_tenantId_userId_reminder_type_key" ON "reminder_preferences"("tenantId", "userId", "reminder_type");

-- CreateIndex
CREATE INDEX "insights_tenantId_userId_status_idx" ON "insights"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "insights_tenantId_insight_type_idx" ON "insights"("tenantId", "insight_type");

-- CreateIndex
CREATE INDEX "insights_tenantId_created_at_idx" ON "insights"("tenantId", "created_at");

-- CreateIndex
CREATE INDEX "patterns_tenantId_userId_pattern_type_idx" ON "patterns"("tenantId", "userId", "pattern_type");

-- CreateIndex
CREATE INDEX "patterns_tenantId_detected_at_idx" ON "patterns"("tenantId", "detected_at");

-- CreateIndex
CREATE INDEX "goals_tenantId_status_idx" ON "goals"("tenantId", "status");

-- CreateIndex
CREATE INDEX "goals_tenantId_target_date_idx" ON "goals"("tenantId", "target_date");

-- CreateIndex
CREATE INDEX "goal_projects_tenantId_goal_id_idx" ON "goal_projects"("tenantId", "goal_id");

-- CreateIndex
CREATE INDEX "goal_projects_tenantId_project_id_idx" ON "goal_projects"("tenantId", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "goal_projects_tenantId_goal_id_project_id_key" ON "goal_projects"("tenantId", "goal_id", "project_id");

-- CreateIndex
CREATE INDEX "goal_ideas_tenantId_goal_id_idx" ON "goal_ideas"("tenantId", "goal_id");

-- CreateIndex
CREATE INDEX "goal_ideas_tenantId_idea_id_idx" ON "goal_ideas"("tenantId", "idea_id");

-- CreateIndex
CREATE UNIQUE INDEX "goal_ideas_tenantId_goal_id_idea_id_key" ON "goal_ideas"("tenantId", "goal_id", "idea_id");

-- CreateIndex
CREATE INDEX "goal_progress_tenantId_goal_id_recorded_at_idx" ON "goal_progress"("tenantId", "goal_id", "recorded_at");

-- CreateIndex
CREATE INDEX "agent_actions_tenantId_status_idx" ON "agent_actions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "agent_actions_tenantId_userId_idx" ON "agent_actions"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "agent_actions_tenantId_action_type_idx" ON "agent_actions"("tenantId", "action_type");

-- CreateIndex
CREATE INDEX "agent_actions_tenantId_created_at_idx" ON "agent_actions"("tenantId", "created_at");

-- CreateIndex
CREATE INDEX "action_templates_tenantId_idx" ON "action_templates"("tenantId");

-- CreateIndex
CREATE INDEX "workflows_tenantId_enabled_idx" ON "workflows"("tenantId", "enabled");

-- CreateIndex
CREATE INDEX "workflows_tenantId_priority_idx" ON "workflows"("tenantId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_executions_idempotency_key_key" ON "workflow_executions"("idempotency_key");

-- CreateIndex
CREATE INDEX "workflow_executions_tenantId_workflow_id_idx" ON "workflow_executions"("tenantId", "workflow_id");

-- CreateIndex
CREATE INDEX "workflow_executions_tenantId_executed_at_idx" ON "workflow_executions"("tenantId", "executed_at");

-- CreateIndex
CREATE INDEX "workflow_executions_idempotency_key_idx" ON "workflow_executions"("idempotency_key");

-- CreateIndex
CREATE INDEX "plans_tenantId_userId_status_idx" ON "plans"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "plans_tenantId_created_at_idx" ON "plans"("tenantId", "created_at");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_plan_id_idx" ON "plan_steps"("tenantId", "plan_id");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_plan_id_step_order_idx" ON "plan_steps"("tenantId", "plan_id", "step_order");

-- CreateIndex
CREATE INDEX "integrations_tenantId_status_idx" ON "integrations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_tenantId_provider_key" ON "integrations"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_integration_id_idx" ON "webhook_events"("tenantId", "integration_id");

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_status_idx" ON "webhook_events"("tenantId", "status");

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_created_at_idx" ON "webhook_events"("tenantId", "created_at");

-- CreateIndex
CREATE INDEX "emails_tenantId_sender_email_idx" ON "emails"("tenantId", "sender_email");

-- CreateIndex
CREATE INDEX "emails_tenantId_received_at_idx" ON "emails"("tenantId", "received_at");

-- CreateIndex
CREATE INDEX "emails_tenantId_classified_as_idx" ON "emails"("tenantId", "classified_as");

-- CreateIndex
CREATE UNIQUE INDEX "emails_tenantId_integration_id_message_id_key" ON "emails"("tenantId", "integration_id", "message_id");

-- CreateIndex
CREATE INDEX "calendar_sync_tenantId_calendar_event_id_idx" ON "calendar_sync"("tenantId", "calendar_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_tenantId_integration_id_item_type_item_id_key" ON "calendar_sync"("tenantId", "integration_id", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "slack_messages_tenantId_user_id_idx" ON "slack_messages"("tenantId", "user_id");

-- CreateIndex
CREATE INDEX "slack_messages_tenantId_created_at_idx" ON "slack_messages"("tenantId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "slack_messages_tenantId_integration_id_message_id_key" ON "slack_messages"("tenantId", "integration_id", "message_id");

-- CreateIndex
CREATE INDEX "notion_sync_tenantId_notion_page_id_idx" ON "notion_sync"("tenantId", "notion_page_id");

-- CreateIndex
CREATE UNIQUE INDEX "notion_sync_tenantId_integration_id_item_type_item_id_key" ON "notion_sync"("tenantId", "integration_id", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "agent_activities_tenantId_userId_idx" ON "agent_activities"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "agent_activities_tenantId_activity_type_idx" ON "agent_activities"("tenantId", "activity_type");

-- CreateIndex
CREATE INDEX "agent_activities_tenantId_created_at_idx" ON "agent_activities"("tenantId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_settings_tenantId_userId_key" ON "agent_settings"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "message_logs_tenantId_userId_idx" ON "message_logs"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "message_logs_tenantId_timestamp_idx" ON "message_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "message_logs_tenantId_category_idx" ON "message_logs"("tenantId", "category");

-- CreateIndex
CREATE INDEX "predictions_tenantId_userId_idx" ON "predictions"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "predictions_tenantId_prediction_type_idx" ON "predictions"("tenantId", "prediction_type");

-- CreateIndex
CREATE INDEX "audio_notes_tenantId_item_type_item_id_idx" ON "audio_notes"("tenantId", "item_type", "item_id");

-- CreateIndex
CREATE INDEX "task_dependencies_tenantId_task_id_idx" ON "task_dependencies"("tenantId", "task_id");

-- CreateIndex
CREATE INDEX "task_dependencies_tenantId_depends_on_task_id_idx" ON "task_dependencies"("tenantId", "depends_on_task_id");

-- CreateIndex
CREATE INDEX "task_dependencies_tenantId_dependency_type_idx" ON "task_dependencies"("tenantId", "dependency_type");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_tenantId_task_id_depends_on_task_id_key" ON "task_dependencies"("tenantId", "task_id", "depends_on_task_id");

-- CreateIndex
CREATE INDEX "task_templates_tenantId_idx" ON "task_templates"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "service_accounts_token_hash_key" ON "service_accounts"("token_hash");

-- CreateIndex
CREATE INDEX "service_accounts_tenantId_idx" ON "service_accounts"("tenantId");

-- CreateIndex
CREATE INDEX "service_accounts_token_hash_idx" ON "service_accounts"("token_hash");

-- CreateIndex
CREATE INDEX "service_accounts_revoked_at_idx" ON "service_accounts"("revoked_at");

