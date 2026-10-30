import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/shared/display-name-schema";
import DisplayNameEditor from "./DisplayNameEditor";

// サーバーは立てないので、/api/profile の action を差し替えて、送られた名前を記録する
function renderEditor(result: object = { success: true }) {
  const submitted: (FormDataEntryValue | null)[] = [];
  const Stub = createRoutesStub([
    { path: "/", Component: () => <DisplayNameEditor name="たなか" /> },
    {
      path: "/api/profile",
      action: async ({ request }) => {
        submitted.push((await request.formData()).get("name"));
        return result;
      },
    },
  ]);
  render(<Stub />);
  return submitted;
}

describe("DisplayNameEditor", () => {
  it("ふだんは名前と編集ボタンだけを出す", () => {
    renderEditor();
    expect(screen.getByText("たなか")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "名前を編集" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("編集を押すと、今の名前が入った入力欄に切り替わる", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "名前を編集" }));
    const input = screen.getByRole("textbox", { name: "名前" });
    expect(input).toHaveValue("たなか");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("maxLength", String(DISPLAY_NAME_MAX_LENGTH));
  });

  it("Enter で保存し、保存できたら表示に戻る", async () => {
    const submitted = renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "名前を編集" }));
    const input = screen.getByRole("textbox", { name: "名前" });
    await userEvent.clear(input);
    await userEvent.type(input, "Tanaka{Enter}");

    expect(await screen.findByRole("button", { name: "名前を編集" })).toBeInTheDocument();
    expect(submitted).toEqual(["Tanaka"]);
  });

  it.each([
    ["Cancel を押す", async () => userEvent.click(screen.getByRole("button", { name: "Cancel" }))],
    ["Esc を押す", async () => userEvent.keyboard("{Escape}")],
  ])("%s と、保存せずに元の名前の表示に戻る", async (_, cancel) => {
    const submitted = renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "名前を編集" }));
    await userEvent.type(screen.getByRole("textbox", { name: "名前" }), "XYZ");
    await cancel();

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("たなか")).toBeInTheDocument();
    expect(submitted).toEqual([]);
  });

  it("保存に失敗したら、入力欄のままエラーを出す", async () => {
    renderEditor({ success: false, error: "名前を入力してください。" });
    await userEvent.click(screen.getByRole("button", { name: "名前を編集" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "名前" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("名前を入力してください。");
    expect(screen.getByRole("textbox", { name: "名前" })).toBeInTheDocument();
  });
});
