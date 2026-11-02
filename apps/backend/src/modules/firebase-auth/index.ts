import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import FirebaseAuthProvider from "./service";

export default ModuleProvider(Modules.AUTH, {
  services: [FirebaseAuthProvider],
});
