import { ComponentLoader, OverridableComponent } from "adminjs";
import path from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL("..", import.meta.url));
export const componentLoader = new ComponentLoader();

export const add = (url: string, componentName: string): string => {
	return componentLoader.add(componentName, path.join(__dirname, url));
};

export const override = (url: string, componentName: OverridableComponent): string =>
	componentLoader.override(componentName, path.join(__dirname, url));

// // Generic components
export const DropZoneShow = add("components/_generic/file-upload/show", "DropZoneShow");
export const DropZone = add("components/_generic/file-upload/edit", "DropZone");
export const CmsRoleEdit = add("components/_generic/role-badge/edit", "CmsRoleEdit");
export const CmsRoleBadge = add("components/_generic/role-badge/show", "CmsRoleBadge");

// Views
export const Media = add("views/media/media", "Media");
export const Dashboard = add("views/dashboard/dashboard", "Dashboard");
export const Login = override("views/auth/login", "Login");

// export const RelationsShow = add("components/_generic/relations/show", "RelationsShow");
// export const RelationsEdit = add("components/_generic/relations/edit", "RelationsEdit");

// UI components
export const ConditionalFieldEdit = add("components/conditional-field/edit", "ConditionalFieldEdit");
export const ConditionalFieldShow = add("components/conditional-field/show", "ConditionalFieldShow");
export const TranslatableEdit = add("components/translatable-input/edit", "TranslatableEdit");
export const TranslatableShow = add("components/translatable-input/show", "TranslatableShow");
export const ToggleSwitch = add("components/toggle/edit", "ToggleSwitch");
export const Toggle = add("components/toggle/show", "Toggle");
