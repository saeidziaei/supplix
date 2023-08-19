import { Cron, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";

export function CronStack({ stack, app }) {
  const { workspaceTaskTable } = use(StorageStack);
  new Cron(stack, "cron", {
    schedule: "rate(1 day)",
    job: {
      function: {
        handler: "services/functions/cron/task-generator.main",
        bind: [workspaceTaskTable],
        environment: {
          WORKSPACETASK_TABLE: workspaceTaskTable.tableName,
        },
      },
    },
  });
}