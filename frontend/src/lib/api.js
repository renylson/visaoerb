async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.erro || `Erro na requisição (${res.status})`);
  return data;
}

export const apiGet    = (path)       => request('GET', path);
export const apiPost   = (path, body) => request('POST', path, body);
export const apiPatch  = (path, body) => request('PATCH', path, body);
export const apiDelete = (path)       => request('DELETE', path);
