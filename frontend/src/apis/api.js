const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const API_ROOT = `${API_URL}/api`;
const TOKEN_KEY = "wrg.auth.token";

function getToken() {
	return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
	if (token) window.localStorage.setItem(TOKEN_KEY, token);
	else window.localStorage.removeItem(TOKEN_KEY);
}

function queryString(params = {}) {
	const query = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") query.set(key, value);
	});
	const value = query.toString();
	return value ? `?${value}` : "";
}

export async function request(path, options = {}) {
	const headers = new Headers(options.headers);
	if (options.body !== undefined) headers.set("Content-Type", "application/json");
	const token = getToken();
	if (token) headers.set("Authorization", `Bearer ${token}`);
	const requestOptions = {
		...options,
		headers,
		cache: options.cache ?? "no-store",
		body: options.body === undefined
			? undefined
			: typeof options.body === "string"
				? options.body
				: JSON.stringify(options.body),
	};
	let response = await fetch(`${API_ROOT}${path}`, requestOptions);
	if (response.status === 304) {
		response = await fetch(`${API_ROOT}${path}`, {
			...requestOptions,
			cache: "reload",
		});
	}
	const body = await response.json().catch(() => null);
	if (!response.ok || body?.success === false) {
		if (response.status === 401) setToken(null);
		const error = new Error(body?.message || "The request failed.");
		error.status = response.status;
		error.details = body?.details;
		throw error;
	}
	return body?.data ?? body;
}

const resource = (base) => ({
	list: (params) => request(`${base}${queryString(params)}`),
	get: (id) => request(`${base}/${id}`),
	create: (body) => request(base, { method: "POST", body }),
	update: (id, body) => request(`${base}/${id}`, { method: "PATCH", body }),
	remove: (id) => request(`${base}/${id}`, { method: "DELETE" }),
});

const reports = {
	list: (params) => request(`/reports${queryString(params)}`),
	get: (id) => request(`/reports/${id}`),
	create: (body) => request("/reports", { method: "POST", body }),
	update: (id, body) => request(`/reports/${id}`, { method: "PUT", body }),
	submit: (id) => request(`/reports/${id}/submit`, { method: "POST" }),
	versions: (id) => request(`/reports/${id}/versions`),
	version: (id, versionId) => request(`/reports/${id}/versions/${versionId}`),
};

const review = {
	list: (params) => request(`/review/reports${queryString(params)}`),
	get: (id) => request(`/review/reports/${id}`),
	approve: (id, comment) => request(`/review/reports/${id}/approve`, { method: "POST", body: { comment } }),
	requestChanges: (id, comment) => request(`/review/reports/${id}/request-changes`, { method: "POST", body: { comment } }),
	comments: (id) => request(`/review/reports/${id}/comments`),
};

const dashboard = {
	summary: (params) => request(`/dashboard/summary${queryString(params)}`),
	tasksTrend: (params) => request(`/dashboard/charts/tasks-trend${queryString(params)}`),
	statusByMember: (params) => request(`/dashboard/charts/status-by-member${queryString(params)}`),
	workloadByProject: (params) => request(`/dashboard/charts/workload-by-project${queryString(params)}`),
	hoursByType: (params) => request(`/dashboard/charts/hours-by-type${queryString(params)}`),
	activityFeed: (params) => request(`/dashboard/activity-feed${queryString(params)}`),
};

export const api = {
	auth: {
		login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
		register: (details) => request("/auth/register", { method: "POST", body: details }),
		me: () => request("/auth/me"),
		logout: () => request("/auth/logout", { method: "POST" }),
	},
	users: {
		...resource("/users"),
		list: (params) => request(`/users${queryString(params)}`),
	},
	projects: {
		...resource("/projects"),
		assign: (id, userId) => request(`/projects/${id}/assign`, { method: "POST", body: { userId } }),
		unassign: (id, userId) => request(`/projects/${id}/assign/${userId}`, { method: "DELETE" }),
	},
	reports,
	review,
	dashboard,
	ai: {
		status: () => request("/ai/status"),
		chat: (message) => request("/ai/chat", { method: "POST", body: { message } }),
	},
	health: () => request("/health"),
};

