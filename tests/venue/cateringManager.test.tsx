import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const createAsync = vi.fn();
const updateAsync = vi.fn();
const deleteAsync = vi.fn();

vi.mock("@/hooks/useVenueResources", () => ({
  useCateringOptions: () => ({
    items: [
      {
        id: 1,
        category: "standard",
        title: "Standard",
        price_per_person: 100,
        menu: [],
      },
      {
        id: 2,
        category: "set_menu",
        title: "Classic Set Menu",
        price_per_person: 200,
        menu: [],
      },
    ],
    isLoading: false,
    createAsync,
    updateAsync,
    deleteAsync,
    isMutating: false,
  }),
}));

import { CateringManager } from "@/components/venue-detail/CateringManager";

describe("CateringManager", () => {
  it("edits catering prices as a per-person amount", () => {
    render(<CateringManager venueId={1} />);

    expect(screen.getAllByText(/Price per person \(EGP\)/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByLabelText("Price per person (EGP)")).toBeInTheDocument();
  });

  it("displays standard pricing per person", () => {
    render(<CateringManager venueId={1} embedded />);

    expect(screen.getByText("10No Cost / person")).toBeInTheDocument();
    expect(screen.getByText("20No Cost / person")).toBeInTheDocument();
  });
});
