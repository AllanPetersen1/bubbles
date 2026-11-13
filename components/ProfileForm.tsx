"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { NotSignedInError, saveProfile } from "@/lib/data";
import { compressPhoto } from "@/lib/image";
import type { SessionUser } from "@/lib/session";
import type { Photo } from "@/lib/types";

/** Custom display name and photo. Left empty, the Google name and photo are used. */
export default function ProfileForm({ user }: { user: SessionUser }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.custom.name ?? "");
  // undefined = keep the current photo, null = remove the custom one, Photo = replace it
  const [avatar, setAvatar] = useState<Photo | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const previewUrl = useMemo(() => (avatar ? URL.createObjectURL(avatar.blob) : null), [avatar]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownAvatar = avatar ? previewUrl : avatar === null ? user.oauth.avatarUrl : user.avatarUrl;
  const hasCustomPhoto = avatar ? true : avatar === null ? false : !!user.custom.avatarUrl;

  async function pick(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    try {
      setAvatar((await compressPhoto(file)).thumb); // 400px is plenty for an avatar
    } catch {
      setMessage({ text: "That photo could not be read. Try another one.", ok: false });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await saveProfile(user.id, { name: name || null, avatar });
      setAvatar(undefined);
      setMessage({ text: "Saved.", ok: true });
    } catch (err) {
      console.error("[bubbles] profile save failed", err);
      setMessage({
        text:
          err instanceof NotSignedInError
            ? err.message
            : "That did not go through. Check your connection and try again.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-8">
      <h2 className="eyebrow mb-3">Your profile</h2>

      <div className="flex items-center gap-4">
        <Avatar name={name || user.oauth.name} url={shownAvatar} size={64} />
        <div className="flex flex-col items-start">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="press min-h-11 text-[13px] underline underline-offset-4"
          >
            Change photo
          </button>
          {hasCustomPhoto && (
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="press min-h-11 text-[13px] text-text-muted underline underline-offset-4"
            >
              Use my Google photo
            </button>
          )}
        </div>
      </div>

      <label htmlFor="display-name" className="eyebrow mt-5 mb-2 block">
        Display name
      </label>
      <input
        id="display-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder={user.oauth.name}
        autoComplete="nickname"
        className="field"
      />
      <p className="mt-2 text-xs text-text-muted">Leave it empty to use the name on your Google account.</p>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-3 text-[13px] ${message.ok ? "text-text-muted" : "text-brand-hover"}`}
        >
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary press mt-4 w-full">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
