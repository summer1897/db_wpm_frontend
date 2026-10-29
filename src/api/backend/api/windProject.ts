/**
 * 风电施工现场管理（移动端后端 /api/mobile/*）的 PC 管理接口。
 *
 * 该文件手写维护：nest-admin 的 mobile 模块未纳入 openapi 生成范围，
 * 字段与 `nest-admin/src/modules/mobile/dto/project.dto.ts` 保持一致。
 */
import { request, type RequestOptions } from '@/utils/request';

/** 项目（PC 端列表/详情回执） */
export interface WindProject {
  id: number;
  code: string;
  name: string;
  /** 移动端接入通道，服务端生成，现场不用手填 */
  scope: string;
  instance: string;
  mode: string;
  integration: string;
  status: 'active' | 'paused' | 'done' | string;
  location?: string;
  capacityMw?: number | null;
  startDate?: string;
  endDate?: string;
  ownerId?: number;
  remark?: string;
  role: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 项目数据汇总（风机/记录/附件） */
export interface WindProjectStats {
  id: number;
  code: string;
  name: string;
  status: string;
  capacityMw?: number | null;
  unitTotal: number;
  unitDone: number;
  entryTotal: number;
  entryPending: number;
  attachmentTotal: number;
  progress: number;
}

export interface WindMember {
  id: number;
  userId: number;
  username: string;
  nickname: string;
  role: WindMemberRole;
  status: number;
}

export type WindMemberRole = 'owner' | 'manager' | 'recorder' | 'viewer';

/** PC 端选人下拉的候选项 */
export interface WindUserOption {
  id: number;
  username: string;
  nickname: string;
  phone: string;
  deptName: string;
  joined: boolean;
  role: string;
}

export interface WindProjectQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface WindProjectPayload {
  code?: string;
  name?: string;
  location?: string;
  capacityMw?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  remark?: string;
}

/** 项目管理列表（分页，管理员可见全部） GET /api/mobile/projects/all */
export async function projectList(params: WindProjectQuery, options?: RequestOptions) {
  return request<{ page: number; pageSize: number; total: number; items: WindProject[] }>(
    '/api/mobile/projects/all',
    {
      method: 'GET',
      params: { ...params },
      ...(options || {}),
    },
  );
}

/** 新建项目（自动生成移动端接入通道，创建人即项目负责人） POST /api/mobile/projects */
export async function projectCreate(body: WindProjectPayload, options?: RequestOptions) {
  return request<WindProject>('/api/mobile/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '项目已创建，请继续添加成员' }),
  });
}

/** 修改项目 PUT /api/mobile/projects/{id} */
export async function projectUpdate(
  id: number,
  body: WindProjectPayload,
  options?: RequestOptions,
) {
  return request<WindProject>(`/api/mobile/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '项目已更新' }),
  });
}

/** 项目成员 GET /api/mobile/projects/{id}/members */
export async function projectMembers(id: number, options?: RequestOptions) {
  return request<WindMember[]>(`/api/mobile/projects/${id}/members`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 添加成员 / 调整角色 POST /api/mobile/projects/{id}/members */
export async function projectMemberUpsert(
  id: number,
  body: { userId: number; role: WindMemberRole },
  options?: RequestOptions,
) {
  return request<WindMember>(`/api/mobile/projects/${id}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || { successMsg: '成员已更新' }),
  });
}

/** 移出成员（负责人不可移出） DELETE /api/mobile/projects/{id}/members/{userId} */
export async function projectMemberRemove(
  id: number,
  userId: number,
  options?: RequestOptions,
) {
  return request<{ userId: number; removed: boolean }>(
    `/api/mobile/projects/${id}/members/${userId}`,
    {
      method: 'DELETE',
      ...(options || { successMsg: '已移出项目' }),
    },
  );
}

/** 可选成员：启用账号 + 是否已加入该项目 GET /api/mobile/admin/users */
export async function projectUserOptions(
  params: { keyword?: string; projectId?: number },
  options?: RequestOptions,
) {
  return request<WindUserOption[]>('/api/mobile/admin/users', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 各项目风机/记录/附件汇总 GET /api/mobile/admin/overview */
export async function projectOverview(options?: RequestOptions) {
  return request<WindProjectStats[]>('/api/mobile/admin/overview', {
    method: 'GET',
    ...(options || {}),
  });
}
