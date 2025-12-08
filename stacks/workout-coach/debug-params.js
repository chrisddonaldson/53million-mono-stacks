// Test what SolidJS router does with wildcard params
const testUrl = "/session/Pull-Volume/Biceps Pump";
const pattern = "/session/:id*";

// Simulate what the router might do
const pathParts = testUrl.split("/").filter(Boolean);
console.log("Path parts:", pathParts);
console.log("After /session:", pathParts.slice(1));

// If it captures everything after /session/ as id
const id = pathParts.slice(1);
console.log("Params.id would be:", id);
console.log("Is array?", Array.isArray(id));
console.log("Joined:", id.join("/"));
