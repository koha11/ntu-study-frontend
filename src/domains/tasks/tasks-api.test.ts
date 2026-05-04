import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchUserTasks,
  fetchGroupTasks,
  fetchTaskById,
  createTask,
  updateTask,
  submitTask,
  approveTask,
  deleteTask,
  mapTaskFromApi,
} from "./tasks-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("tasks-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("mapTaskFromApi", () => {
    it("maps snake_case fields to Task", () => {
      const t = mapTaskFromApi({
        id: "t1",
        title: "A",
        status: "in_progress",
        group_id: "g1",
        created_by_id: "u1",
        assignee_id: "u2",
        due_date: "2026-05-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      });
      expect(t.id).toBe("t1");
      expect(t.status).toBe("in_progress");
      expect(t.groupId).toBe("g1");
      expect(t.createdById).toBe("u1");
      expect(t.assigneeId).toBe("u2");
      expect(t.dueDate).toBe("2026-05-01T00:00:00.000Z");
    });

    it("maps nested assignee and parent_task", () => {
      const t = mapTaskFromApi({
        id: "t2",
        title: "Sub item",
        status: "todo",
        created_by_id: "u1",
        assignee_id: "u2",
        parent_task_id: "p1",
        parent_task: { id: "p1", title: "Parent epic" },
        assignee: { id: "u2", full_name: "Alex Lee", avatar_url: "https://x.test/a.png" },
        created_at: "",
        updated_at: "",
      });
      expect(t.parentTaskTitle).toBe("Parent epic");
      expect(t.assigneeName).toBe("Alex Lee");
      expect(t.assigneeAvatarUrl).toBe("https://x.test/a.png");
    });
  });

  describe("fetchUserTasks", () => {
    it("calls GET /tasks with Authorization", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchUserTasks("tok");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/tasks");
      expect(init.method).toBe("GET");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    });

    it("appends status and assignedInGroups query params", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchUserTasks("tok", { status: "todo", assignedInGroups: true });

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("/tasks?");
      expect(url).toContain("status=todo");
      expect(url).toContain("assignedInGroups=true");
    });

    it("throws HttpError when not ok", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(fetchUserTasks("t")).rejects.toMatchObject({ status: 403 });
    });
  });

  describe("fetchGroupTasks", () => {
    it("calls GET /tasks?groupId=", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchGroupTasks("g1", "tok");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/tasks?groupId=g1");
      expect(init.method).toBe("GET");
    });
  });

  describe("fetchTaskById", () => {
    it("calls GET /tasks/:id", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "t1",
            title: "X",
            status: "todo",
            created_by_id: "u1",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const task = await fetchTaskById("t1", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/tasks/t1",
        expect.objectContaining({ method: "GET" }),
      );
      expect(task.id).toBe("t1");
    });
  });

  describe("createTask", () => {
    it("calls POST /tasks with snake_case body", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "new",
            title: "N",
            status: "todo",
            created_by_id: "u1",
            group_id: "g1",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createTask({ title: "N", groupId: "g1" }, "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/tasks",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "N", group_id: "g1" }),
        }),
      );
    });

    it("POST /tasks includes parent_task_id for subtasks", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "sub1",
            title: "Sub",
            status: "todo",
            created_by_id: "u1",
            group_id: "g1",
            parent_task_id: "p1",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createTask(
        { title: "Sub", groupId: "g1", parentTaskId: "p1", assigneeId: "u2" },
        "tok",
      );

      expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual(
        expect.objectContaining({
          title: "Sub",
          group_id: "g1",
          parent_task_id: "p1",
          assignee_id: "u2",
        }),
      );
    });
  });

  describe("updateTask", () => {
    it("calls PATCH /tasks/:id", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "t1",
            title: "Up",
            status: "in_progress",
            created_by_id: "u1",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await updateTask("t1", { status: "in_progress" }, "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/tasks/t1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "in_progress" }),
        }),
      );
    });
  });

  describe("submitTask", () => {
    it("calls PATCH /tasks/:id/submit", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "t1",
            title: "X",
            status: "pending_review",
            created_by_id: "u1",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await submitTask("t1", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/tasks/t1/submit",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  describe("approveTask", () => {
    it("calls PATCH /tasks/:id/approve with status", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "t1",
            title: "X",
            status: "done",
            created_by_id: "u1",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await approveTask("t1", { status: "done" }, "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/tasks/t1/approve",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "done" }),
        }),
      );
    });
  });

  describe("deleteTask", () => {
    it("calls DELETE /tasks/:id", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });
      vi.stubGlobal("fetch", fetchMock);

      await deleteTask("t1", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/tasks/t1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("throws HttpError on failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(deleteTask("x", "t")).rejects.toBeInstanceOf(HttpError);
    });
  });
});
