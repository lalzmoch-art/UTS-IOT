// app.js — used by pages that only need sidebar (edukasi)
if (!api.requireAuth()) throw new Error('unauth');
initSidebar();
