import { prisma } from '../index'

export async function clearAllData(tenantId: string): Promise<{ totalRemoved: number; removedByTable: Record<string, number> }> {
  const removedByTable: Record<string, number> = {}
  let totalRemoved = 0

  await prisma.$transaction(async (tx) => {
    // Clear inbox_log
    const inboxLogCount = await tx.inboxLog.deleteMany({ where: { tenantId } })
    removedByTable['inbox_log'] = inboxLogCount.count
    totalRemoved += inboxLogCount.count

    // Clear digests
    const digestsCount = await tx.digest.deleteMany({ where: { tenantId } })
    removedByTable['digests'] = digestsCount.count
    totalRemoved += digestsCount.count

    // Clear people
    const peopleCount = await tx.person.deleteMany({ where: { tenantId } })
    removedByTable['people'] = peopleCount.count
    totalRemoved += peopleCount.count

    // Clear projects
    const projectsCount = await tx.project.deleteMany({ where: { tenantId } })
    removedByTable['projects'] = projectsCount.count
    totalRemoved += projectsCount.count

    // Clear ideas
    const ideasCount = await tx.idea.deleteMany({ where: { tenantId } })
    removedByTable['ideas'] = ideasCount.count
    totalRemoved += ideasCount.count

    // Clear admin
    const adminCount = await tx.admin.deleteMany({ where: { tenantId } })
    removedByTable['admin'] = adminCount.count
    totalRemoved += adminCount.count
  })

  return { totalRemoved, removedByTable }
}
