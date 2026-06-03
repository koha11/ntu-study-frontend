/**
 * GroupForm Component
 *
 * Form for creating/editing a group.
 * Uses react-hook-form and zod for validation.
 *
 * Phase 5 UI Redesign:
 * - Replace with shadcn/ui Form component
 * - Add better input styling
 * - Add form validation feedback
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CreateGroupInput, UpdateGroupInput } from "../types";

interface GroupFormProps {
  initialData?: { id: string; name: string; description?: string; tags?: string[] };
  isLoading?: boolean;
  onSubmit: (data: CreateGroupInput | UpdateGroupInput) => void;
  onCancel?: () => void;
}

export function GroupForm({ initialData, isLoading = false, onSubmit, onCancel }: GroupFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    tags: initialData?.tags || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description,
      tags: formData.tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">{t("groups.groupName")}</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">{t("groups.description")}</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? t("common.saving") : t("common.save")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-foreground"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
