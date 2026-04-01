CREATE TABLE "CopieProgressEvent" (
  "id" TEXT NOT NULL,
  "copieId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "progress" INTEGER,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CopieProgressEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CopieProgressEvent"
ADD CONSTRAINT "CopieProgressEvent_copieId_fkey"
FOREIGN KEY ("copieId") REFERENCES "CopieDeposee"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CopieProgressEvent_copieId_createdAt_idx"
ON "CopieProgressEvent"("copieId", "createdAt");
