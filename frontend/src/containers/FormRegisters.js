import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Header,
  Icon,
  List, Message, Segment, Table
} from "semantic-ui-react";

import { LinkContainer } from "react-router-bootstrap";
import { Loader } from "semantic-ui-react";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import FormHeader from "../components/FormHeader";
import { Link, useParams } from "react-router-dom";
import "./FormRegisters.css";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import systemTemplateConfig from '../components/systemTemplates/systemTemplateConfig'; 
import { isSystemTemplate } from "../lib/helpers";

export default function FormRegisters() {
  const [templates, setTemplates] = useState(null);
  const [workspace, setWorkspace] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const { workspaceId } = useParams();

  useEffect(() => {
    async function onLoad() {

      setIsLoading(true);
      try {
        const templates = await loadTemplates();
        const { data, workspace } = templates ?? {};

        // Merge systemTemplates with the templates read from the database
        const mergedTemplates = [
          ...data,
          ...systemTemplateConfig.systemTemplates,
        ];


        if (
          workspace &&
          workspace.templateCategories &&
          workspace.templateCategories.length
        ) {
          // Filter the templates based on the templateIds in the workspace
          const filteredTemplates = mergedTemplates.filter((template) =>
            workspace.templateCategories.includes(
              template.templateDefinition?.category
            )
          );

          setTemplates(filteredTemplates);
        } else {
          setTemplates(mergedTemplates);
        }

        setWorkspace(workspace);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }
    onLoad();
  }, [workspaceId]);

  async function loadTemplates() {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/templates`);
  }

  function renderCategories() {
    if (templates && templates.length) {
      let categories = ['ALL'].concat([...new Set(templates.map(t => t.templateDefinition.category))]);
      
      return (
        <div className="flex flex-wrap mt-2">
        
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-md p-3 m-1 bg-blue-50 text-blue-400 hover:bg-slate-300 ${category === selectedCategory && "bg-blue-500 !text-white !font-bold"}`}
          >
            {category}
          </button>
        ))}
      </div>
      
      );
    } 
  }

  function renderTemplatesList() {
    return (
      <div className="mx-auto px-4 w-full  xl:w-2/3">
        <WorkspaceInfoBox workspace={workspace} leafFolder="Records Register"/>
        {(!templates || templates.length == 0) && (
          <Message
            header="No Record found"
            content="Start by creating your first record!"
            icon="exclamation"
          />
        )}
        {renderCategories()}
        <div className="grid grid-cols-3 gap-6  p-6 justify-center text-lg ">
        {templates &&
                    templates
                      .filter(
                        (t) =>
                          selectedCategory === "ALL" ||
                          selectedCategory === t.templateDefinition.category
                      )
                      .map((t) => {
                        const def = t.templateDefinition;
                        return (
                          <a
                            key={t.templateId}
                            href={`/workspace/${workspaceId}/register/${t.templateId}`}
                            className="bg-gray-100 col-span-6 md:col-span-1 text-black border-l-8 border-sky-900 rounded-md px-3 py-2 sm:hover:shadow-2xl"
                          >
                            {def.title}

                            <div className="text-gray-500 font-thin text-sm pt-1">
                              <a
                                className="float-right  px-2 py-1 min-w-[80px] text-center text-blue-400 border border-blue-400 rounded hover:bg-blue-600 hover:text-white  focus:outline-none focus:ring"
                                href={`/workspace/${workspaceId}/form/${t.templateId}`}
                              >
                                <Icon name="plus"/>
                                Create
                              </a>
                            </div>
                            <div className="text-gray-500 font-thin text-sm pt-1">{def.category}</div>
                            <div className="text-gray-500 font-thin text-sm pt-1">
                              {isSystemTemplate(t.templateId)
                                ? "View"
                                : `${t.formCount} ${pluralize(
                                    "record",
                                    t.formCount
                                  )}`}
                            </div>
                          </a>
                        );
                      })}
    </div>
    
      </div>
    );
  }

  if (isLoading) return <Loader active />;

  return renderTemplatesList();
}
