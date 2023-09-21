import { getTemplate } from "./get";
import dynamoDb from "../../util/dynamodb";
import * as uuid from "uuid";

export const main = async (event, context) => {
  for (const record of event.Records) {
    try {
      const streamData = record.dynamodb;
      if (!streamData) {
        console.warn(
          "[WARNING]",
          "DynamoDB data is missing in this record.",
          record
        );
        continue;
      }
      if (!streamData.NewImage) {
        continue; // skip deletion
        // TODO, maybe consider deleting the associated Task
      }

      if (
        record.eventName === "INSERT" ||
        (record.eventName === "MODIFY" && isAssigneeIdChanged(streamData))
      ) {
        const assigneeId = streamData.NewImage.assigneeId.S;
        const tenant = streamData.NewImage.tenant.S;
        const formId = streamData.NewImage.formId.S;
        const workspaceId = streamData.NewImage.workspaceId.S;
        const templateId = streamData.NewImage.templateId.S;
        const templateVersion = streamData.NewImage.templateVersion.N;
        const assignorId = streamData.NewImage.updatedBy ? streamData.NewImage.updatedBy.S : streamData.NewImage.createdBy?.S;

        const template = await getTemplate(tenant, templateId, templateVersion);

        if (!template || !template.templateDefinition) {
          console.warn(
            "[WARNING]",
            "createTaskFor Assignee. Template not found.",
            record
          );
          continue;
        }

        if (!assigneeId || assigneeId === "-1") {
          continue; // skip if no assignee
        }

        const taskName = `[Assignment] - ${template.templateDefinition.title}`;
        const note = `<p>A record has been assigned to you which requires your attention. 
          Please see the details <a href="/workspace/${workspaceId}/form/${templateId}/${formId}">here</a></p>
          <p>This Task has been created and assigned to you automatically. You can mark this task as Complete when your work on the record is finalised.</p>`;

        await createTask(tenant, workspaceId, taskName, note, assigneeId, assignorId);

       
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

function isAssigneeIdChanged(input) {
  if (!input.NewImage || !input.NewImage.assigneeId) {
    return false;
  }

  const oldUserId = input.OldImage.assigneeId.S;
  const newUserId = input.NewImage.assigneeId.S;

  return oldUserId !== newUserId;
}


async function createTask(tenant, workspaceId, taskName, note, assigneeId, assignorId) {
  const item = {
    tenant_workspaceId: `${tenant}_${workspaceId}`, // pk
    tenant: tenant,
    workspaceId: workspaceId,
    taskId: uuid.v1(),
    userId: assigneeId || "-1", // userId is in a secondary index and cannot be empty
    taskName: taskName || "",
    note: note || "",
    taskCode: "",
    taskType: "",
    taskStatus: "",

    createdBy: assignorId,
    createdAt: Date.now(),
  };

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    Item: item,
  };

  await dynamoDb.put(params);
}