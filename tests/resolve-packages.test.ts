import path from "path";
import tempy from "tempy";

import { resolvePackages } from "~/resolve-packages";

describe("resolvePackages", () => {
  it("should return an empty array if no packages are found", () => {
    const actual = resolvePackages(tempy.directory());

    expect(actual).toEqual([]);
  });

  it("[integration] should resolve the expected packages", () => {
    const actual = resolvePackages(
      path.join(__dirname, "__fixtures__/example-monorepo"),
    );

    expect(actual).toMatchSnapshot();
  });
});
