import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("MedControl App", () => {
  it("renders the main heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /^Ваш личный помощник\s*в мире лекарств$/
      })
    ).toBeTruthy();
  });
});
