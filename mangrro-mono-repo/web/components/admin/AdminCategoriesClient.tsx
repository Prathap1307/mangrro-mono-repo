"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { AdminCategory, AdminCategoryType } from "@/lib/admin/catalog";

interface Props {
  initialCategories: AdminCategory[];
  categoryType: AdminCategoryType;
  categoryEndpoint?: string;
  parentEndpoint?: string;
  hideImageUpload?: boolean;
}

interface CategoryFormState {
  name: string;
  active: boolean;
  categoryType: AdminCategoryType;
  reason: string;
  reactivateOn: string;
  position: number;
  highlightText: string;
  parentCategoryId: string;
  imageKey: string;
  imageUrl: string;
  searchKeywords: string;
}

const CATEGORY_TYPE_LABELS: Record<
  AdminCategoryType,
  { singular: string; plural: string }
> = {
  main: { singular: "Main Category", plural: "Main Categories" },
  category: { singular: "Category", plural: "Categories" },
  subcategory: { singular: "Subcategory", plural: "Subcategories" },
};

const PARENT_TYPE_BY_CHILD: Record<
  AdminCategoryType,
  AdminCategoryType | null
> = {
  main: null,
  category: "main",
  subcategory: "category",
};

const formatDatetimeLocalValue = (value?: string) => {
  if (!value) return "";
  if (!value.includes("T")) {
    return `${value}T00:00`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDatetimeDisplay = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )} UTC`;
};

const toIsoTimestamp = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

export default function AdminCategoriesClient({
  initialCategories,
  categoryType,
  categoryEndpoint = "/api/admin/categories",
  parentEndpoint = "/api/admin/categories",
  hideImageUpload = false,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<CategoryFormState>({
    name: "",
    active: true,
    categoryType,
    reason: "",
    reactivateOn: "",
    position: 1,
    highlightText: "",
    parentCategoryId: "",
    imageKey: "",
    imageUrl: "",
    searchKeywords: "",
  });

  const [categories, setCategories] =
    useState<AdminCategory[]>(initialCategories);
  const [parentCategories, setParentCategories] =
    useState<AdminCategory[]>([]);
  const parentType = PARENT_TYPE_BY_CHILD[categoryType];

  const loadCategories = async () => {
    const res = await fetch(categoryEndpoint);
    const json = await res.json();
    setCategories(json.data ?? json ?? []);
  };

  const loadParentCategories = async () => {
    if (!parentType) return;
    const res = await fetch(parentEndpoint);
    const json = await res.json();
    setParentCategories(json.data ?? json ?? []);
  };

  useEffect(() => {
    void loadCategories();
    void loadParentCategories();
  }, [categoryEndpoint, parentEndpoint, parentType]);

  const createCategory = async (category: AdminCategory) => {
    await fetch(categoryEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    loadCategories();
  };

  const updateCategory = async (id: string, data: Partial<AdminCategory>) => {
    await fetch(`${categoryEndpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadCategories();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`${categoryEndpoint}/${id}`, {
      method: "DELETE",
    });
    loadCategories();
  };

  const handleSave = async () => {
    if (parentType && !formState.parentCategoryId) {
      alert(
        `Please select a ${CATEGORY_TYPE_LABELS[parentType].singular} parent.`
      );
      return;
    }

    const searchKeywords = formState.searchKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 20);

    const imageUrl =
      formState.imageUrl && !formState.imageUrl.startsWith("blob:")
        ? formState.imageUrl
        : undefined;

    const nextPayload = {
      ...formState,
      categoryType,
      parentCategoryId: parentType ? formState.parentCategoryId : "",
      searchKeywords,
      reactivateOn: toIsoTimestamp(formState.reactivateOn),
      imageKey: formState.imageKey || undefined,
      imageUrl,
    };

    if (editingId) {
      await updateCategory(editingId, nextPayload);
    } else {
      const newId =
        formState.name.toLowerCase().replace(/\s+/g, "-") ||
        crypto.randomUUID();

      await createCategory({
        id: newId,
        ...nextPayload,
      });
    }

    setModalOpen(false);
    setEditingId(null);
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;

    const res = await fetch(
      `/api/upload-url?file=${encodeURIComponent(file.name)}&type=${file.type}`
    );
    const { uploadUrl, key } = await res.json();

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (editingId && formState.imageKey && formState.imageKey !== key) {
      await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: formState.imageKey }),
      });
    }

    setFormState((prev) => ({
      ...prev,
      imageKey: key,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  const labels = CATEGORY_TYPE_LABELS[categoryType];
  const parentLabels = parentType ? CATEGORY_TYPE_LABELS[parentType] : null;
  const parentOptions = parentType
    ? parentCategories.filter((category) => category.categoryType === parentType)
    : [];

  const visibleCategories = categories.filter(
    (category) => category.categoryType === categoryType
  );

  const columns = [
    ...(hideImageUpload ? [] : [{ key: "image", label: "Image" }]),
    { key: "name", label: labels.singular },
    ...(parentType
      ? [{ key: "parent", label: parentLabels?.singular ?? "Parent" }]
      : []),
    { key: "position", label: "Position" },
    { key: "highlightText", label: "Highlight" },
    { key: "searchKeywords", label: "Keywords" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const parentNameLookup = new Map(
    parentCategories.map((category) => [category.id, category.name])
  );

  return (
    <AdminShell>
      <AdminPageTitle
        title={labels.plural}
        description={`Manage ${labels.plural.toLowerCase()} visibility and schedules.`}
        action={
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"
            onClick={() => {
              setEditingId(null);
              setFormState({
                name: "",
                active: true,
                categoryType,
                reason: "",
                reactivateOn: "",
                position: visibleCategories.length + 1,
                highlightText: "",
                parentCategoryId: "",
                imageKey: "",
                imageUrl: "",
                searchKeywords: "",
              });
              setModalOpen(true);
            }}
          >
            <FiPlus /> Add {labels.singular}
          </button>
        }
      />

      <AdminCard title={`${labels.singular} controls`} description="">
        <AdminTable
          columns={columns}
          data={visibleCategories}
          renderCell={(category, key) => {
            if (key === "image") {
              if (!category.imageKey) return "—";
              return (
                <img
                  src={
                    category.imageUrl ||
                    `/api/image-proxy?key=${category.imageKey}`
                  }
                  alt={`${category.name} preview`}
                  className="h-10 w-10 rounded-lg border object-cover"
                />
              );
            }

            if (key === "searchKeywords")
              return category.searchKeywords?.length
                ? category.searchKeywords.length
                : "—";

            if (key === "status") {
              if (category.active) {
                return <AdminBadge label="Active" tone="success" />;
              }

              if (category.reactivateOn) {
                return (
                  <div className="flex flex-col gap-1">
                    <AdminBadge label="Scheduled" tone="warning" />
                    <span className="text-xs text-slate-500">
                      {formatDatetimeDisplay(category.reactivateOn)}
                    </span>
                  </div>
                );
              }

              return <AdminBadge label="Inactive" tone="warning" />;
            }

            if (key === "position") return category.position ?? "—";

            if (key === "highlightText") return category.highlightText || "—";

            if (key === "parent")
              return category.parentCategoryId
                ? parentNameLookup.get(category.parentCategoryId) ??
                    category.parentCategoryId
                : "—";

            if (key === "actions")
              return (
                <div className="flex gap-2 text-xs font-semibold">
                  <button
                    className="rounded bg-blue-50 px-3 py-1 text-blue-700"
                    onClick={() => {
                      setEditingId(category.id);
                      setFormState({
                        name: category.name,
                        active: category.active,
                        categoryType: category.categoryType ?? categoryType,
                        reason: category.reason ?? "",
                        reactivateOn: formatDatetimeLocalValue(
                          category.reactivateOn ?? ""
                        ),
                        position: category.position ?? 1,
                        highlightText: category.highlightText ?? "",
                        parentCategoryId: category.parentCategoryId ?? "",
                        imageKey: category.imageKey ?? "",
                        imageUrl: category.imageUrl ?? "",
                        searchKeywords: category.searchKeywords?.join(", ") ?? "",
                      });
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="rounded bg-rose-50 px-3 py-1 text-rose-700"
                    onClick={() => deleteCategory(category.id)}
                  >
                    Delete
                  </button>
                  </div>
                );

            return (category[key as keyof AdminCategory] ?? "") as React.ReactNode;
          }}
        />
      </AdminCard>

      <AdminModal
        title={editingId ? `Edit ${labels.singular}` : `Add ${labels.singular}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={handleSave}
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <AdminFormField
            label={`${labels.singular} name`}
            value={formState.name}
            onChange={(e) =>
              setFormState((p) => ({ ...p, name: e.target.value }))
            }
          />

          <AdminFormField
            label="Homepage position"
            type="number"
            min={1}
            value={formState.position}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                position: Number(e.target.value) || 1,
              }))
            }
            hint="Lower numbers appear higher on the homepage"
          />

          <AdminFormField
            label="Highlight text"
            value={formState.highlightText}
            onChange={(e) =>
              setFormState((p) => ({ ...p, highlightText: e.target.value }))
            }
            hint="Optional banner copy shown above the category"
          />

          <AdminFormField
            label="Search query"
            value={formState.searchKeywords}
            onChange={(e) =>
              setFormState((p) => ({ ...p, searchKeywords: e.target.value }))
            }
            hint="Comma-separated keywords (up to 20)"
          />

          {!hideImageUpload && formState.imageKey && (
            <div>
              <p className="text-sm font-semibold text-slate-900">Preview</p>
              <img
                src={
                  formState.imageUrl ||
                  `/api/image-proxy?key=${formState.imageKey}`
                }
                className="mt-2 h-32 w-auto rounded-xl border object-cover"
              />
            </div>
          )}

          {!hideImageUpload && (
            <AdminFormField
              label="Upload image"
              type="file"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
            />
          )}

          {parentType ? (
            <AdminFormField
              label={`${parentLabels?.singular ?? "Parent"} parent`}
              hint={`Select a ${parentLabels?.singular?.toLowerCase() ?? "parent"} for this ${labels.singular.toLowerCase()}.`}
            >
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formState.parentCategoryId}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    parentCategoryId: e.target.value,
                  }))
                }
              >
                <option value="">
                  Select {parentLabels?.singular ?? "parent"}
                </option>
                {parentOptions.map((parentCategory) => (
                  <option key={parentCategory.id} value={parentCategory.id}>
                    {parentCategory.name}
                  </option>
                ))}
              </select>
            </AdminFormField>
          ) : null}

          {/* Active / Inactive radio */}
          <div className="space-y-2">
            <label className="font-semibold">Status</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  checked={formState.active === true}
                  onChange={() =>
                    setFormState((p) => ({ ...p, active: true }))
                  }
                />
                <span className="ml-2">Active</span>
              </label>

              <label>
                <input
                  type="radio"
                  checked={formState.active === false}
                  onChange={() =>
                    setFormState((p) => ({ ...p, active: false }))
                  }
                />
                <span className="ml-2">Inactive</span>
              </label>
            </div>
          </div>

          <AdminFormField
            label="Reason"
            value={formState.reason}
            onChange={(e) =>
              setFormState((p) => ({ ...p, reason: e.target.value }))
            }
          />

          <AdminFormField
            label="Reactivation date"
            type="datetime-local"
            value={formState.reactivateOn}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                reactivateOn: e.target.value,
              }))
            }
          />
        </div>
      </AdminModal>
    </AdminShell>
  );
}
