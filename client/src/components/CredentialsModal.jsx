import { useState } from 'react';
import Modal from './Modal.jsx';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the value is still selectable on screen */
    }
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-2">
        <code className="flex min-h-11 flex-1 items-center rounded-md border border-steel-600 bg-steel-950 px-3 font-mono text-accent select-all">
          {value}
        </code>
        <button className="btn w-20" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// credentials: { loginId, password } | null
export default function CredentialsModal({ credentials, onClose }) {
  return (
    <Modal open={!!credentials} onClose={onClose} title="Login credentials">
      {credentials && (
        <div className="space-y-4">
          <p className="rounded-md border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
            Copy these now. The password is shown only once and cannot be recovered (you can reset it later).
          </p>
          <CopyRow label="Login ID" value={credentials.loginId} />
          <CopyRow label="Password" value={credentials.password} />
          <button
            className="btn w-full"
            onClick={() => navigator.clipboard?.writeText(`Login ID: ${credentials.loginId}\nPassword: ${credentials.password}`)}
          >
            Copy both
          </button>
          <button className="btn btn-primary w-full" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
