<div className="post">
  <div className="post-header">
    <h2 className="post-title">{title}</h2>
    <span className="post-timestamp">
      {new Date(timestamp).toLocaleDateString()}
    </span>
  </div>
  <p className="post-content">{content}</p>
</div> 