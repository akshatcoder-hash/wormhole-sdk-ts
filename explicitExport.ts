import ts from "typescript";
import fs from "fs";
import path from "path";

function getModuleExports(filePath: string): string[] {
  const program = ts.createProgram({
    rootNames: [filePath],
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });
  const srcFile = program.getSourceFile(filePath)!;
  const checker = program.getTypeChecker();

  const sourceFileSymbol = checker.getSymbolAtLocation(srcFile)!;
  const exports = checker.getExportsOfModule(sourceFileSymbol);
  return exports.map((exp) => exp.getName());
}

function findExports(filePath: string) {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.ES2022,
  );

  const exports: Record<string, string[]> = {};
  ts.forEachChild(sourceFile, (node) => {
    // Find wildcard exports from index.ts files
    if (ts.isExportDeclaration(node) && !node.exportClause && node.moduleSpecifier) {
      // @ts-ignore
      const fileName = node.moduleSpecifier!.text;

      // external re-exports, skippy
      if (fileName.startsWith("@")) return;

      // maybe a dir or a file
      const modulePath = path.join(path.dirname(filePath), fileName);

      let isDir = false;
      try {
        // will throw if not a directory
        isDir = fs.statSync(modulePath).isDirectory();
      } catch {}

      const file = isDir ? path.join(modulePath, "index.ts") : modulePath + ".ts";
      const name = path.basename(modulePath);
      try {
        exports[name] = getModuleExports(file);
      } catch (e) {
        console.log("Failed to get module exports for ", file, "Referred to by", filePath);
        console.log(e);
      }
    }
  });
  return exports;
}

function updateExportStatements(directoryPath: string) {
  const contents = fs.readdirSync(directoryPath).map((file) => path.join(directoryPath, file));
  const dirs = contents.filter((filePath) => fs.statSync(filePath).isDirectory());

  // Recurse first, then read the index file for the current directory
  dirs.forEach(updateExportStatements);

  const index = contents.find(
    (filePath) => fs.statSync(filePath).isFile() && path.basename(filePath) === "index.ts",
  );
  if (!index || !fs.statSync(index).isFile() || path.basename(index) !== "index.ts") {
    console.log("No index.ts file found in", directoryPath);
    return;
  }

  // Only update index.ts exports directly
  let fileContent = fs.readFileSync(index, "utf8");
  const exports = findExports(index);
  for (const [name, exported] of Object.entries(exports)) {
    if (exported.length === 0) continue;
    // Replace the export statement with named exports (this is a simplified replacement logic)
    const wildcardExport = `export * from "./${name}";`;
    // Note: in the case of an export with names that already exist, this will not handle it
    // and some modification will be required
    const explicitExport = `export {${exported.join(", ")}} from "./${name}";`;
    fileContent = fileContent.replace(wildcardExport, explicitExport);
  }
  fs.writeFileSync(index, fileContent, "utf8");
}

function identifyWorkspaces(directoryPath: string) {
  // find all packages in workspaces package.json file
  const packageFile = fs.readFileSync(path.join(directoryPath, "package.json"), "utf8");
  const packageJson = JSON.parse(packageFile);
  for (const ws of packageJson.workspaces) {
    console.log("Working on", ws);
    updateExportStatements(path.join(directoryPath, ws, "src"));
  }
}

function rootDir(): string {
  return path.join(__dirname);
}

identifyWorkspaces(rootDir());
