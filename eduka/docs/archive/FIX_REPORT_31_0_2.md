# Fix Report 31.0.2

Problem: old and new CRM renderers were both active. `crm-real-workflow-30-5.js` mounted the Pro UI first, then `app.js` rendered legacy dashboard after data finished loading, causing a visible switch.

Fix: route ownership guard + render lock. Pro routes now keep the Pro UI as the final owner.
