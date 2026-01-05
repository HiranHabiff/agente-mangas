CREATE TABLE "status" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "status"."id" IS '';
COMMENT ON COLUMN "status"."name" IS '';
COMMENT ON COLUMN "status"."description" IS '';
COMMENT ON COLUMN "status"."created_at" IS '';
CREATE INDEX "idx_status_name" ON "status" ("name");


CREATE TABLE "types" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "types"."id" IS '';
COMMENT ON COLUMN "types"."name" IS '';
COMMENT ON COLUMN "types"."description" IS '';
COMMENT ON COLUMN "types"."created_at" IS '';
CREATE INDEX "idx_types_name" ON "types" ("name");


CREATE TABLE "ratings" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "ratings"."id" IS '';
COMMENT ON COLUMN "ratings"."name" IS '';
COMMENT ON COLUMN "ratings"."description" IS '';
COMMENT ON COLUMN "ratings"."created_at" IS '';
CREATE INDEX "idx_ratings_name" ON "ratings" ("name");



CREATE TABLE "characters" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "characters"."id" IS '';
COMMENT ON COLUMN "characters"."name" IS '';
COMMENT ON COLUMN "characters"."description" IS '';
COMMENT ON COLUMN "characters"."created_at" IS '';
CREATE INDEX "idx_characters_name" ON "characters" ("name");



CREATE TABLE "warnings" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "warnings"."id" IS '';
COMMENT ON COLUMN "warnings"."name" IS '';
COMMENT ON COLUMN "warnings"."description" IS '';
COMMENT ON COLUMN "warnings"."created_at" IS '';
CREATE INDEX "idx_warnings_name" ON "warnings" ("name");




CREATE TABLE "demographic" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "demographic"."id" IS '';
COMMENT ON COLUMN "demographic"."name" IS '';
COMMENT ON COLUMN "demographic"."description" IS '';
COMMENT ON COLUMN "demographic"."created_at" IS '';
CREATE INDEX "idx_demographic_name" ON "demographic" ("name");





CREATE TABLE "sites" (
	"id" UUID NOT NULL DEFAULT uuid_generate_v4(),
	"name" VARCHAR(100) NOT NULL,
	"url" VARCHAR(255) NOT NULL,
	"image" VARCHAR(255) NOT NULL,
	"language" VARCHAR(50) NOT NULL,
	"active" BOOLEAN NULL DEFAULT true,
	"description" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE ("name"),
	PRIMARY KEY ("id")
);
COMMENT ON COLUMN "sites"."id" IS '';
COMMENT ON COLUMN "sites"."name" IS '';
COMMENT ON COLUMN "sites"."url" IS '';
COMMENT ON COLUMN "sites"."image" IS '';
COMMENT ON COLUMN "sites"."language" IS '';
COMMENT ON COLUMN "sites"."active" IS '';
COMMENT ON COLUMN "sites"."description" IS '';
COMMENT ON COLUMN "sites"."created_at" IS '';
CREATE INDEX "idx_sites_name" ON "sites" ("name");
CREATE INDEX "idx_sites_url" ON "sites" ("url");
CREATE INDEX "idx_sites_language" ON "sites" ("language");
CREATE INDEX "idx_sites_active" ON "sites" ("active");
