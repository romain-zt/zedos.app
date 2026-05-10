/**
 * Mapper Base Class
 * 
 * Enforces explicit, bidirectional mapping between layers:
 * - Domain ↔ Persistence (entity to/from Prisma model)
 * - Domain ↔ DTO (entity to/from API response)
 * - Persistence ↔ DTO
 * 
 * No implicit conversions. Every transformation is declared, tested, and auditable.
 * 
 * Example:
 *   class ProjectMapper extends Mapper<Project, PrismaProject, ProjectDTO> {
 *     toDomain(raw: PrismaProject): Project { ... }
 *     toPersistence(domain: Project): PrismaProject { ... }
 *     toDTO(domain: Project): ProjectDTO { ... }
 *   }
 */

export abstract class Mapper<Domain, Persistence = Domain, DTO = Domain> {
  /**
   * Domain → Persistence layer (Prisma model)
   * Used before persisting to database.
   */
  abstract toPersistence(domain: Domain): Persistence;

  /**
   * Persistence → Domain
   * Used when loading from database.
   */
  abstract toDomain(persistence: Persistence): Domain;

  /**
   * Domain → DTO (API response)
   * Used when returning to client.
   * Default: returns domain as-is. Override for custom serialization.
   */
  toDTO(domain: Domain): DTO {
    return domain as any;
  }

  /**
   * Persistence → DTO (direct, skipping domain)
   * Optimization for read-heavy operations. Default delegates to: toDTO(toDomain(p))
   * Override for performance-critical paths.
   */
  persistenceToDTO(persistence: Persistence): DTO {
    return this.toDTO(this.toDomain(persistence));
  }

  /**
   * DTO → Domain (API request deserialization)
   * Default: returns DTO as-is. Override for custom deserialization.
   */
  fromDTO(dto: DTO): Domain {
    return dto as any;
  }
}

/**
 * Mapper composition utility for complex multi-step transformations
 */
export const compose = <A, B, C>(
  mapperAB: Mapper<A, any, B>,
  mapperBC: Mapper<B, any, C>
): Mapper<A, any, C> => {
  return new (class extends Mapper<A, any, C> {
    toPersistence(a: A) {
      return mapperAB.toPersistence(a);
    }
    toDomain(p: any) {
      return mapperAB.toDomain(p);
    }
    toDTO(a: A): C {
      return mapperBC.toDTO(mapperAB.toDTO(a) as any);
    }
  })();
};