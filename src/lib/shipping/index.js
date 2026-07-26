import { shippoProvider } from "./shippo";

// Routes talk to this module, never to a specific carrier SDK. Swapping to
// Delhivery/Shiprocket means adding a provider file that returns the same
// shapes and changing this one line — no route or UI changes.
const provider = shippoProvider;

export const getRates = (args) => provider.getRates(args);
export const buyLabel = (args) => provider.buyLabel(args);
export const providerName = provider.name;