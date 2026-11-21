/* Mock data + a tiny persisted store. */
window.App = window.App || {};

(function (App) {
  var STORAGE_KEY = "maha.store.v1";

  function seed() {
    var firstNames = ["Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Karan", "Meera", "Arjun", "Isha",
      "Rahul", "Divya", "Nikhil", "Pooja", "Sanjay", "Kavya", "Aditya", "Neha", "Siddharth", "Riya",
      "Manoj", "Tanvi", "Harsh", "Shreya"];
    var lastNames = ["Sharma", "Patil", "Deshmukh", "Iyer", "Kulkarni", "Joshi", "Mehta", "Rao", "Nair", "Gupta",
      "Shinde", "Pawar"];
    var roles = ["Owner", "Admin", "Member", "Member", "Member", "Viewer", "Billing"];
    var statuses = ["Active", "Active", "Active", "Active", "Invited", "Suspended"];

    var users = firstNames.map(function (fn, i) {
      var ln = lastNames[(i * 5) % lastNames.length];
      var daysAgo = (i * 3) % 40;
      return {
        id: "u" + (i + 1),
        name: fn + " " + ln,
        email: (fn + "." + ln).toLowerCase() + "@acme.io",
        role: i === 0 ? "Owner" : roles[(i % (roles.length - 1)) + 1],
        status: i === 0 ? "Active" : statuses[i % statuses.length],
        lastLogin: new Date(Date.now() - daysAgo * 86400000 - i * 3600000).toISOString()
      };
    });

    var invoices = [];
    for (var m = 0; m < 12; m++) {
      var d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - m);
      invoices.push({
        id: "INV-" + (2026100 - m),
        date: d.toISOString(),
        description: "Pro plan — " + d.toLocaleString("en-US", { month: "long", year: "numeric" }),
        amount: 49 * 20,
        status: m === 0 ? "Open" : m === 4 ? "Failed" : "Paid"
      });
    }

    return {
      org: { name: "Acme Corp", plan: "pro", seats: 25 },
      currentUser: { name: "Siva Ram", email: "siva.ram@acme.io", role: "Owner" },
      users: users,
      roles: [
        { id: "Owner", description: "Full access, including billing and deleting the workspace.",
          perms: { viewDashboard: true, manageUsers: true, manageRoles: true, manageBilling: true, exportData: true } },
        { id: "Admin", description: "Manage users and settings. No billing access.",
          perms: { viewDashboard: true, manageUsers: true, manageRoles: true, manageBilling: false, exportData: true } },
        { id: "Billing", description: "View and manage subscriptions and invoices.",
          perms: { viewDashboard: true, manageUsers: false, manageRoles: false, manageBilling: true, exportData: false } },
        { id: "Member", description: "Standard access to the product.",
          perms: { viewDashboard: true, manageUsers: false, manageRoles: false, manageBilling: false, exportData: true } },
        { id: "Viewer", description: "Read-only access.",
          perms: { viewDashboard: true, manageUsers: false, manageRoles: false, manageBilling: false, exportData: false } }
      ],
      invoices: invoices,
      paymentMethod: { brand: "Visa", last4: "4242", expiry: "08/28" }
    };
  }

  // Static (non-persisted) reference data
  App.plans = [
    { id: "free", name: "Free", price: 0, seats: 3, features: ["3 seats", "Basic analytics", "Community support"] },
    { id: "pro", name: "Pro", price: 49, seats: 25, features: ["Up to 25 seats", "Advanced analytics", "Role-based access", "Email support"] },
    { id: "enterprise", name: "Enterprise", price: 199, seats: 500, features: ["Unlimited seats*", "SSO & audit logs", "Custom roles", "Dedicated success manager"] }
  ];

  App.permissionLabels = {
    viewDashboard: "View dashboard",
    manageUsers: "Manage users",
    manageRoles: "Manage roles",
    manageBilling: "Manage billing",
    exportData: "Export data"
  };

  App.metrics = {
    months: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    mrr: [38200, 40100, 41800, 43900, 45200, 47800, 50300, 52100, 55600, 58200, 61400, 64850],
    signups: [182, 164, 210, 238, 221, 265, 290, 276, 318, 342, 331, 376],
    kpis: [
      { label: "Monthly recurring revenue", value: 64850, format: "currency", delta: 5.6 },
      { label: "Active customers", value: 1284, format: "number", delta: 3.2 },
      { label: "Churn rate", value: 2.1, format: "percent", delta: -0.4, invert: true },
      { label: "New signups (30d)", value: 376, format: "number", delta: 13.6 }
    ],
    activity: [
      { text: "Globex Ltd upgraded to Enterprise", time: 12 },
      { text: "New signup: Initech Solutions", time: 47 },
      { text: "Invoice INV-2026099 paid by Umbrella Inc", time: 95 },
      { text: "Stark Industries added 8 seats", time: 180 },
      { text: "Wayne Enterprises cancelled subscription", time: 320 },
      { text: "New signup: Hooli", time: 610 }
    ],
    topCustomers: [
      { name: "Globex Ltd", plan: "Enterprise", mrr: 4980 },
      { name: "Stark Industries", plan: "Enterprise", mrr: 3980 },
      { name: "Umbrella Inc", plan: "Pro", mrr: 1960 },
      { name: "Initech Solutions", plan: "Pro", mrr: 1470 },
      { name: "Hooli", plan: "Pro", mrr: 980 }
    ]
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable or corrupt — fall back to seed */ }
    return seed();
  }

  App.store = {
    state: load(),
    save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
    },
    reset: function () {
      this.state = seed();
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }
  };
})(window.App);
