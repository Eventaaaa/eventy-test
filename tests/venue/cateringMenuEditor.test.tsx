import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CateringMenuEditor } from "@/components/venue-detail/CateringMenuEditor";
import { parseCateringMenuDraft, serializeCateringMenuDraft } from "@/lib/catering";

describe("CateringMenuEditor", () => {
  it("renders one textarea per category and keeps existing joiners", () => {
    let draft = serializeCateringMenuDraft([
      { title: "Drinks", items: ["Juice"], joiner: "OR" },
    ]);
    const onChange = (value: string) => {
      draft = value;
    };

    render(<CateringMenuEditor id="new-menu" value={draft} onChange={onChange} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByLabelText("Beverages")).toHaveValue("Juice");

    fireEvent.change(screen.getByLabelText("Main Courses"), {
      target: { value: "Steak, Chicken" },
    });

    expect(parseCateringMenuDraft(draft)).toEqual([
      { title: "Main Courses", items: ["Steak", "Chicken"] },
      { title: "Beverages", items: ["Juice"], joiner: "OR" },
    ]);
  });
});
