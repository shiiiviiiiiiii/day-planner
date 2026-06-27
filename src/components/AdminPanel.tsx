import React, { useState, useEffect } from "react";
import { type Activity, plannerStorage } from "../lib/storage";

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onLogout }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setActivities(plannerStorage.getActivities());
    setPhotoBase64(plannerStorage.getPhoto());
  }, []);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newAct = plannerStorage.addActivity(newTitle);
    setActivities([...activities, newAct]);
    setNewTitle("");
  };

  const handleToggleHide = (activity: Activity) => {
    const updated = { ...activity, hidden: !activity.hidden };
    plannerStorage.updateActivity(updated);
    setActivities(activities.map((a) => (a.id === activity.id ? updated : a)));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      plannerStorage.deleteActivity(id);
      setActivities(activities.filter((a) => a.id !== id));
    }
  };

  const startEdit = (activity: Activity) => {
    setEditingActivity({ ...activity });
  };

  const handleSaveEdit = () => {
    if (!editingActivity || !editingActivity.title.trim()) return;
    plannerStorage.updateActivity(editingActivity);
    setActivities(activities.map((a) => (a.id === editingActivity.id ? editingActivity : a)));
    setEditingActivity(null);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    const reordered = [...activities];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const final = reordered.map((act, idx) => ({ ...act, order: idx }));
    plannerStorage.saveActivities(final);
    setActivities(final);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const listCopy = [...activities];
    const draggedItem = listCopy[draggedIndex];
    listCopy.splice(draggedIndex, 1);
    listCopy.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setActivities(listCopy);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    const final = activities.map((act, idx) => ({ ...act, order: idx }));
    plannerStorage.saveActivities(final);
    setActivities(final);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file.");
      return;
    }

    if (file.size > 1.2 * 1024 * 1024) {
      setUploadError("Photo is too large. Choose a file under 1.2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      plannerStorage.savePhoto(base64);
      setPhotoBase64(base64);
    };
    reader.onerror = () => {
      setUploadError("Error reading image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    plannerStorage.savePhoto(null);
    setPhotoBase64(null);
  };

  return (
    <div className="admin-panel font-typewriter">
      {/* Header bar */}
      <div className="admin-header-row">
        <h2 className="font-header admin-panel-title">Admin Dashboard</h2>
        <div className="admin-btn-group">
          <button onClick={onBack} className="btn-dash">
            ← Back
          </button>
          <button onClick={onLogout} className="btn-dash text-danger">
            Log Out
          </button>
        </div>
      </div>

      {/* Polaroid Image Management */}
      <section className="admin-section">
        <h3 className="font-header section-title">Polaroid Memory Photo</h3>
        <p className="section-note italic">
          Upload a favorite picture of the day. If left blank, it will show an empty frame with "A memory will live here someday".
        </p>

        <div className="photo-editor-flex">
          {photoBase64 ? (
            <div className="photo-preview-thumbnail">
              <img src={photoBase64} alt="Polaroid thumbnail" className="photo-preview-img" />
            </div>
          ) : (
            <div className="photo-preview-empty">
              No Photo
            </div>
          )}

          <div className="photo-uploader-details">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="photo-file-input"
            />
            {uploadError && <p className="upload-error-message font-semibold">{uploadError}</p>}
            <p className="upload-specs-note italic">Max size: 1.2MB. Auto-fits in Polaroid card.</p>
            {photoBase64 && (
              <button onClick={handleRemovePhoto} className="remove-photo-btn underline font-semibold">
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Add activity form */}
      <section className="admin-section">
        <h3 className="font-header section-title">Add New Activity</h3>
        <form onSubmit={handleAddActivity} className="add-activity-form">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Type activity title..."
            className="input-text"
          />
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </section>

      {/* Activities list editor */}
      <section className="admin-section">
        <h3 className="font-header section-title">Manage checklist</h3>
        <p className="section-note italic">
          💡 Drag items to reorder them on desktop, or use the ▲ ▼ arrow buttons on mobile.
        </p>

        <div className="activities-editor-list">
          {activities.map((activity, idx) => {
            const isEditing = editingActivity?.id === activity.id;

            return (
              <div
                key={activity.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`editor-list-item ${draggedIndex === idx ? "dragging" : ""}`}
              >
                {/* Drag handle & Order arrows */}
                <div className="reorder-controls">
                  <span className="drag-handle-icon">☰</span>
                  <div className="arrow-controls flex flex-col">
                    <button
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="arrow-btn"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === activities.length - 1}
                      className="arrow-btn"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Edit inline vs view */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editingActivity.title}
                    onChange={(e) =>
                      setEditingActivity({ ...editingActivity, title: e.target.value })
                    }
                    className="input-text flex-1"
                    autoFocus
                  />
                ) : (
                  <span className={`editor-item-title ${activity.hidden ? "hidden-text" : ""}`}>
                    {activity.title} {activity.hidden && <span className="hidden-badge font-semibold">[Hidden]</span>}
                  </span>
                )}

                {/* Actions */}
                <div className="editor-item-actions">
                  {isEditing ? (
                    <>
                      <button onClick={handleSaveEdit} className="action-save-btn">
                        Save
                      </button>
                      <button onClick={() => setEditingActivity(null)} className="action-cancel-btn">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(activity)} className="action-link">
                        Edit
                      </button>
                      <button onClick={() => handleToggleHide(activity)} className="action-link">
                        {activity.hidden ? "Restore" : "Hide"}
                      </button>
                      <button onClick={() => handleDelete(activity.id)} className="action-link text-danger">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
