import pluralize from "pluralize";
import React, { useEffect, useState } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { useParams } from "react-router-dom";
import { Divider, Header, List, Loader, Message } from "semantic-ui-react";
import FooterButtons from "../components/FooterButtons";
import { WorkspaceInfoBox } from "../components/WorkspaceInfoBox";
import { makeApiCall } from "../lib/apiLib";
import { onError } from "../lib/errorLib";
import { capitalizeFirstLetter } from '../lib/helpers';

export default function Docs() {
  const [docs, setDocs] = useState([]);
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      try {
        const items = await loadDocs();
        // loadDocs has workspaceId in the path therefore items are in data element and it also returns workspace
        const { data, workspace } = items ?? {};

        const modifiedItems = data.map((item) => {
          const fileNameWithoutFolder = item.fileName?.replace(/^docs\//, "");
          return { ...item, fileNameWithoutFolder };
        });
        
        setDocs(modifiedItems);
        setWorkspace(workspace);

      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, []);

  async function loadDocs() {
    return await makeApiCall("GET", `/workspaces/${workspaceId}/docs`);
  }


  function renderCategories() {
    if (docs && docs.length) {
      let categories = ["ALL"].concat([
        ...new Set(docs.map((d) => d.category)),
      ]);

      return (
        <div className="flex flex-wrap mt-2">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-md p-3 m-1 bg-purple-50 text-purple-700 hover:bg-slate-300 ${
                category === selectedCategory && "!bg-purple-700 !text-white !font-bold"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      );
    }
  }
  
  function renderDocs() {
    const groupedChildren =
      !docs || docs.length == 0
        ? []
        : docs.reduce((result, child) => {
            const group = result.find(
              (group) => group[0].category === child.category
            );

            if (group) {
              group.push(child);
            } else {
              result.push([child]);
            }

            return result;
          }, []);

    return (
      <div className="">
        <div className="h-screen flex justify-center mt-2">
          <div className="mx-auto px-4 w-full xl:w-3/5">
          <WorkspaceInfoBox workspace={workspace} leafFolder="Library" />
      {renderCategories()}

        
        {(!docs || docs.length == 0) && (
          <Message
            header="No docs found in your library"
            content="Start by creating your first doc!"
            icon="exclamation"
          />
        )}
        {docs && docs.length > 0 && (
          <div className="grid grid-cols-3 gap-6  p-6 justify-center text-lg">
            {
              docs.filter((d) =>
              selectedCategory === "ALL" ||
              selectedCategory === d.category).map(d => (
              <a key={d.docId}
              href={`/workspace/${workspaceId}/doc/${d.docId}`}
               className="bg-gray-100 col-span-6 md:col-span-1 text-black border-l-8 border-purple-800 rounded-md px-3 py-2 sm:hover:shadow-2xl">
                {d.fileNameWithoutFolder}
                <div className="text-gray-500 font-thin text-sm pt-1">{d.note}</div>
                </a>))
            }

          </div>
        )}
 
<FooterButtons rightButton={{label: "New", icon: "plus", link: `/workspace/${workspaceId}/doc`}} />
        </div></div>
        </div>
    );
  }
  return isLoading ? (<Loader active/>) : renderDocs();
}
