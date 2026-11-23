/** The selected logical workspace, separate from its immutable signed snapshot. */
export interface WorkspaceContext {
  key: string;
  partnerId: string;
  name: string;
  chainIds: readonly number[];
  revision: string;
}
