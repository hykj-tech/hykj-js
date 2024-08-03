import { withInstall } from '../../utils/install'

import CP from './table.vue'

export const BaseTable = withInstall(CP)

export type {BaseTableColumn, BaseTablePagination, BaseTableProps} from './type'

export default BaseTable

// export * from '.'
