import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Loader } from "semantic-ui-react";
import FooterButtons from "../components/FooterButtons";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import { datetimeToString } from "../lib/helpers";

export default function WorkspaceInout() {
  const [isLoading, setIsLoading] = useState(true);
  const { workspaceId, taskId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [lastIn, setLastIn] = useState(null);
  const { currentUserRoles } = useAppContext();
  const isAdmin = currentUserRoles.includes("admins");

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

  const nav = useNavigate();

  const canSeeAllInouts = () => workspace && workspace.role === "Owner";

  useEffect(() => {
    async function loadLastIn() {
      return await makeApiCall(
        "GET",
        `/workspaces/${workspaceId}/inouts/lastin`
      );
    }
    async function loadWorkspaceMembers() {
      return await makeApiCall("GET", `/workspaces/${workspaceId}/members`);
    }

    async function onLoad() {
      try {
        const members = await loadWorkspaceMembers();

        // workspaceId in the path therefore results are in data element and it also returns workspace
        const { data: membersData, workspace } = members ?? {};
        setWorkspace(workspace);

        const lastIn = await loadLastIn();
        const { data: lastInData } = lastIn ?? {};
        setLastIn(lastInData);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function createInout(item) {
    const endpoint = `/workspaces/${workspaceId}/inouts`;

    return await makeApiCall("POST", endpoint, item);
  }  
  async function updateInout(item) {
    const endpoint = `/workspaces/${workspaceId}/inouts/${lastIn.inoutId}`;

    return await makeApiCall("PUT", endpoint, item);
  }



  async function handleSignIn() {
    setIsLoading(true);
    try {
      await createInout({});
      nav(-1);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    }
  }
  async function handleSignOut() {
    setIsLoading(true);
    try {
      await updateInout({});
      nav(-1);
    } catch (e) {
      onError(e);
    } finally {
      setIsLoading(false);
    } 
  }

  const defaultValues = {};

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('en-AU', options);
  };
  
  // Function to calculate time difference and format the output
  const datetimeToString = (ts) => {
    if (!ts) return "";
  
    const now = new Date();
    const date = new Date(ts);
    const timeDiff = now - date; // Difference in milliseconds
  
    const diffHours = Math.floor(timeDiff / (1000 * 60 * 60));
    const diffMinutes = Math.ceil((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
    let relativeTime;
    if (diffHours >= 24) {
      relativeTime = `+24 hours ago`;
    } else if (diffHours > 0) {
      relativeTime = `${diffHours} hours ${diffMinutes} minutes ago`;
    } else {
      relativeTime = `${diffMinutes} minutes ago`;
    }
  
    const formattedDate = formatDate(date);
  
    return `You signed into this site ${relativeTime} at ${formattedDate}`;
  };
  


  const render = () => {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <WorkspaceInfoBox workspace={workspace} leafFolder="Site Presence" />
        <div className="p-4 border  rounded-lg my-2">
        <div className="flex justify-center mb-6">
          <img src="../../inout.svg" alt="Icon" className="w-16 h-16" />
        </div>
        {lastIn && (
  <div className="bg-yellow-100 border border-yellow-500 text-yellow-900 px-4 py-3 rounded-lg mb-6">
    <p className="font-bold text-lg">{datetimeToString(lastIn.inAt)}</p>
  </div>
)}        <div className="space-y-6">
          <div className="text-gray-700 flex flex-col">
            <strong className="text-lg">In/Out Status:</strong>
            <p className="mt-2 text-base">
              {workspace.hasInout ? "true" : "false"}
            </p>
          </div>
          <div className="text-gray-700 flex flex-col">
            <strong className="text-lg">Site Owner:</strong>
            <p className="mt-2 text-base">{workspace.siteOwner}</p>
          </div>
          <div className="text-gray-700 flex flex-col">
            <strong className="text-lg">Site Address:</strong>
            <p className="mt-2 text-base">{workspace.siteAddress}</p>
          </div>
        </div>
      </div>
      
      {/* Rounded Box with Light Red Border for Notes */}
      <div className="text-gray-700 flex flex-col p-4 border border-red-200 rounded-lg bg-red-50 w-full">
        <strong className="text-lg">Notes:</strong>
        <div
          className="mt-2 text-base"
          dangerouslySetInnerHTML={{ __html: workspace.inoutNote }}
        />
      </div>
        <FooterButtons
          rightButton={
            lastIn
              ? {
                  label: "Leave Site",
                  icon: "arrow left",
                  color: "blue",
                  onClick: () => handleSignOut(),
                }
              : {
                  label: "Sign In",
                  icon: "arrow right",
                  color: "teal",
                  onClick: () => handleSignIn(),
                }
          }
        />
      </div>
    );
  };

  if (isLoading) return <Loader active />;

  return render();
}
