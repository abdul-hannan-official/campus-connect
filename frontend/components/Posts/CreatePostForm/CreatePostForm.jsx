import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatePostForm.css";

const MAX_TITLE_LENGTH = 300;

// Form tab ("post" | "image" | "link") -> backend post type.
const BACKEND_TYPE = { post: "text", image: "image", link: "link" };

export default function CreatePostForm({ type = "post", selectedClub }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [image, setImage] = useState(null);
  const [document, setDocument] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const navigate = useNavigate();

  const canSubmit =
    selectedClub &&
    title.trim().length > 0 &&
    !isSubmitting &&
    (type === "post" ||
      (type === "image" && image) ||
      (type === "link" && linkUrl.trim().length > 0));

  /* IMAGE HANDLERS */
  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  /* DOCUMENT HANDLER (PDF / Word / PowerPoint) */
  const handleDocChange = (e) => {
    if (e.target.files?.[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const uploadDocument = async () => {
    if (!document) return null;
    const formData = new FormData();
    formData.append("document", document);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/document`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Document upload failed");
    }
    const data = await res.json();
    return data.documentUrl;
  };

  /* SUBMIT */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      // Optional document attachment first (shared by all post types).
      let attachments = [];
      if (document) {
        try {
          const url = await uploadDocument();
          if (url) attachments = [url];
        } catch (err) {
          alert(err.message);
          return;
        }
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: body,
          type: BACKEND_TYPE[type] || "text",
          linkUrl: type === "link" ? linkUrl.trim() : "",
          attachments,
          clubId: selectedClub._id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to create post");
        return;
      }

      const newPost = await res.json();

      // IMAGE POST: upload the image afterwards (base behaviour).
      if (type === "image" && image) {
        const formData = new FormData();
        formData.append("postImage", image);
        formData.append("postId", newPost._id);

        const imgRes = await fetch(
          `${import.meta.env.VITE_API_URL}/upload/post-image`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );

        if (!imgRes.ok) {
          alert("Image upload failed");
          return;
        }
      }

      navigate(`/posts/${newPost._id}`);
    } catch (err) {
      console.error("CREATE POST ERROR:", err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* RENDER */

  return (
    <form
      className="create-post-form"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      {/* TITLE */}
      <div className="input-wrap">
        <input
          className="input"
          type="text"
          placeholder="Title"
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <span className="input-required">*</span>
        <span className="title-count">
          {title.length}/{MAX_TITLE_LENGTH}
        </span>
      </div>

      {/* LINK URL */}
      {type === "link" && (
        <div className="input-wrap">
          <input
            className="input"
            type="url"
            placeholder="https://example.com/resource"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            required
          />
          <span className="input-required">*</span>
        </div>
      )}

      {/* BODY TEXT (POST + IMAGE) */}
      {(type === "post" || type === "image") && (
        <div className="textarea-wrap">
          <textarea
            className="textarea"
            placeholder={
              selectedClub ? "Body text" : "Select a club first"
            }
            disabled={!selectedClub}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      )}

      {/* IMAGE POST */}
      {type === "image" && (
        <div
          className="dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
        >
          <span className="dropzone-text">Drag and Drop or upload media</span>

          {image && <div className="image-preview">{image.name}</div>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* OPTIONAL DOCUMENT ATTACHMENT (all post types) */}
      <div className="doc-attach">
        <button
          type="button"
          className="btn secondary"
          onClick={() => docInputRef.current?.click()}
        >
          Attach document (PDF / Word / PowerPoint)
        </button>
        {document && <span className="doc-name">{document.name}</span>}
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          style={{ display: "none" }}
          onChange={handleDocChange}
        />
      </div>

      {/* ACTIONS */}
      <div className="btn-row">
        <button
          className={`btn primary ${!canSubmit ? "disabled" : ""}`}
          type="submit"
          disabled={!canSubmit}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
