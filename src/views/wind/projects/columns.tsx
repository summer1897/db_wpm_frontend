import { Tag } from 'ant-design-vue';
import type { TableColumn } from '@/components/core/dynamic-table';
import type { WindProject, WindProjectStats } from '@/api/backend/api/windProject';

/** 列表行：项目基础信息 + 汇总统计（风机/记录/附件） */
export type TableListItem = WindProject & Partial<WindProjectStats>;
export type TableColumnItem = TableColumn<TableListItem>;

export const statusText: Record<string, string> = {
  active: '在建',
  paused: '暂停',
  done: '已完工',
};

export const statusColor: Record<string, string> = {
  active: 'green',
  paused: 'orange',
  done: 'default',
};

export const roleText: Record<string, string> = {
  owner: '项目负责人',
  manager: '管理员',
  recorder: '记录员',
  viewer: '只读',
};

/** 角色可做的事，直接写在页面上，避免分配时靠猜 */
export const roleTip: Record<string, string> = {
  owner: '审核记录、分配成员、修改项目',
  manager: '审核记录、修改事项与记录',
  recorder: '新增风机/事项、拍照填报',
  viewer: '只能查看，不能填报',
};

export const baseColumns: TableColumnItem[] = [
  {
    title: '项目编号',
    dataIndex: 'code',
    width: 120,
    align: 'left',
  },
  {
    title: '项目名称',
    dataIndex: 'name',
    align: 'left',
    ellipsis: true,
  },
  {
    title: '所在地',
    dataIndex: 'location',
    width: 160,
    align: 'left',
    ellipsis: true,
  },
  {
    title: '装机容量',
    dataIndex: 'capacityMw',
    width: 110,
    customRender: ({ record }) => (record.capacityMw ? `${record.capacityMw} MW` : '—'),
  },
  {
    title: '成员',
    dataIndex: 'memberCount',
    width: 80,
    customRender: ({ record }) => record.memberCount ?? '—',
  },
  {
    title: '风机/事项',
    dataIndex: 'unitTotal',
    width: 150,
    customRender: ({ record }) => {
      if (!record.unitTotal) return <span class="text-gray-400">暂无风机</span>;
      return (
        <span>
          {record.unitDone}/{record.unitTotal}
          <span class="text-gray-400"> · {record.progress ?? 0}%</span>
        </span>
      );
    },
  },
  {
    title: '施工记录',
    dataIndex: 'entryTotal',
    width: 150,
    customRender: ({ record }) => {
      if (!record.entryTotal) return <span class="text-gray-400">暂无记录</span>;
      return (
        <span>
          {record.entryTotal} 条
          {record.entryPending ? (
            <Tag color="orange" class="ml-1">
              待审 {record.entryPending}
            </Tag>
          ) : null}
        </span>
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
    customRender: ({ record }) => (
      <Tag color={statusColor[record.status] || 'default'}>
        {statusText[record.status] || record.status}
      </Tag>
    ),
  },
  {
    title: '计划工期',
    dataIndex: 'startDate',
    width: 200,
    customRender: ({ record }) =>
      record.startDate || record.endDate ? `${record.startDate || '—'} ~ ${record.endDate || '—'}` : '未设置',
  },
];
