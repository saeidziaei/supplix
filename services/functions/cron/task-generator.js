import dynamoDb from "../../util/dynamodb";
import * as uuid from "uuid";

export async function main() {
  console.log("[INFO]", "Running task generator cron job");

  const now = new Date();
  now.setHours(23, 59, 59, 999); // Set time to the end of the day

  const currentDate = now.getTime(); // unix Timestamp Milliseconds
  console.log(currentDate);
  try {
    const recurringTasks = await getRecurringTasks(currentDate);
    console.info(
      "[INFO]",
      `Looking into ${recurringTasks.length} recurring tasks`
    );

    for (const task of recurringTasks) {
      await generateAndSaveTask(task, currentDate);
    }
  } catch (error) {
    console.error("[ERROR]", "Error in task generator:", error);
  }
}

async function getRecurringTasks(currentDate) {

  const queryParams = {
      TableName: process.env.WORKSPACETASK_TABLE,
      IndexName: 'isRecurringIndex',
      KeyConditionExpression: "isRecurring = :isRecurring",
      FilterExpression: "startDate <= :currentDate AND (endDate >= :currentDate OR attribute_not_exists(endDate))",
      ExpressionAttributeValues: {
          ":isRecurring": "Y",
          ":currentDate": currentDate,
      },
  };

  try {
      const result = await dynamoDb.query(queryParams);
      return result.Items;
  } catch (error) {
      console.error("Error querying recurring tasks:", error);
      throw error;
  }
}

async function generateAndSaveTask(task, currentDate) {
  const lastRunTime = task.lastRunTime || 0;

  const intervalInMillis = getFrequencyInMillis(task.frequency);

  console.table(task);
  console.log(currentDate);
  if (lastRunTime + intervalInMillis <= currentDate) {
      const newTask = {
          tenant_workspaceId: task.tenant_workspaceId,
          tenant: task.tenant,
          workspaceId: task.workspaceId,
          taskId: uuid.v1(),
          recurringTaskId: task.taskId,
          userId: task.userId || "-1",
          taskName: task.taskName || "",
          note: task.note || "",
          taskCode: task.taskCode || "",
          taskType: task.taskType || "",
          createdBy: task.createdAt,
          createdAt: currentDate,
          isRecurring: "N",
      };

      const putParams = {
          TableName: process.env.WORKSPACETASK_TABLE,
          Item: newTask,
      };

      const updateParams = {
          TableName: process.env.WORKSPACETASK_TABLE,
          Key: {
              tenant_workspaceId: task.tenant_workspaceId,
              taskId: task.taskId,
          },
          UpdateExpression: "SET lastRunTime = :lastRunTime",
          ExpressionAttributeValues: {
              ":lastRunTime": Date.now(),
          },
      };

      const transactParams = {
        TransactItems: [{ Put: putParams }, { Update: updateParams }],
      };

      try {
          await dynamoDb.transactWrite(transactParams);
          console.log("Generated task:", newTask);
      } catch (error) {
          console.error("Error generating or updating task:", error);
      }
  }
}


// Helper function to get frequency in milliseconds
function getFrequencyInMillis(frequency) {
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  switch (frequency) {
    case "Daily":
      return dayMilliseconds;
    case "Weekly":
      return 7 * dayMilliseconds;
    case "Fortnightly":
      return 14 * dayMilliseconds;
    case "Monthly":
      // Approximate value, you might want to improve this calculation
      return 30 * dayMilliseconds;
    case "ThreeMonthly":
      // Approximate value, you might want to improve this calculation
      return 3 * 30 * dayMilliseconds;
    case "SixMonthly":
      // Approximate value, you might want to improve this calculation
      return 6 * 30 * dayMilliseconds;
    case "Yearly":
      // Approximate value, you might want to improve this calculation
      return 365 * dayMilliseconds;
    default:
      return dayMilliseconds; // Default to daily
  }
}