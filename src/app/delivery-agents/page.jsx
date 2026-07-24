"use client";
import React, { useState, useEffect } from "react";
import Applayout from "../component/Applayout";
import axios from "axios";
import toast from "react-hot-toast";
import { confirmToast } from "@/lib/confirmToast";

const GRID_COLS = "grid grid-cols-[1fr_1fr_140px] items-center gap-2";

const DeliveryAgents = () => {
  const [agents, setAgents] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingAgent, setEditingAgent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const formVisible = showForm || !!editingAgent;

  const fetchAgents = () => {
    axios.get("/api/delivery-agents").then((resp) => setAgents(resp.data.data));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") resetForm();
    };
    if (formVisible) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [formVisible]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEditingAgent(null);
    setShowForm(false);
  };

  const saveAgent = async (e) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await axios.put("/api/delivery-agents", { _id: editingAgent._id, name, phone });
        toast.success("Agent updated.");
      } else {
        await axios.post("/api/delivery-agents", { name, phone });
        toast.success("Agent added.");
      }
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error("Failed to save agent:", error);
      toast.error("Failed to save agent.");
    }
  };

  const editAgent = (agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setPhone(agent.phone);
  };

  const deleteAgent = (agent) => {
    confirmToast(`Delete delivery agent "${agent.name}"?`, async () => {
      setAgents((prev) => prev.filter((a) => a._id !== agent._id));
      try {
        await axios.delete("/api/delivery-agents?id=" + agent._id);
        toast.success("Agent deleted.");
      } catch (error) {
        console.error("Failed to delete agent:", error);
        toast.error("Failed to delete agent. Please try again.");
        fetchAgents();
      }
    });
  };

  return (
    <Applayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-0">Delivery Agents</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add agent
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
        <div
          className={`${GRID_COLS} px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg text-xs font-medium text-gray-500 dark:text-gray-400 uppercase`}
        >
          <span>Name</span>
          <span>Phone</span>
          <span>Actions</span>
        </div>
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
          {agents?.length > 0 ? (
            agents.map((agent) => (
              <div key={agent._id} className={`${GRID_COLS} px-4 py-3`}>
                <span className="font-medium text-gray-900 dark:text-gray-100">{agent.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{agent.phone}</span>
                <span className="flex gap-2">
                  <button
                    className="btn-icon-edit"
                    onClick={() => editAgent(agent)}
                    aria-label="Edit agent"
                    title="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    className="btn-icon-delete"
                    onClick={() => deleteAgent(agent)}
                    aria-label="Delete agent"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500">
              No delivery agents yet. Add one to get started.
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          formVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={resetForm}
      />

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 dark:bg-gray-900 shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          formVisible ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!formVisible}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0">
            {editingAgent ? `Edit "${editingAgent.name}"` : "Add agent"}
          </h2>
          <button
            className="btn-icon-edit"
            onClick={resetForm}
            aria-label="Close panel"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="agent-form" onSubmit={saveAgent} className="flex-1 overflow-y-auto p-5">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-4">
            <div>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent name"
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button className="btn-primary" type="submit" form="agent-form">
            Save
          </button>
          <button className="btn-default" type="button" onClick={resetForm}>
            Cancel
          </button>
        </div>
      </div>
    </Applayout>
  );
};

export default DeliveryAgents;