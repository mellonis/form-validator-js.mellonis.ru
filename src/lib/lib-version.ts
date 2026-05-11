import projectPkg from '../../package.json';

// Pulled from the project's package.json (the same value as the installed package).
// Bumping the dep in package.json automatically updates everywhere the version is shown.
export const libVersion: string = projectPkg.dependencies['@form-validator-js/core'];
