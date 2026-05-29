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

/** Bridges unrelated mapper type parameters for default identity mappings. */
function bridgeTypes<From, To>(value: From): To {
  return value as never as To;
}

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
    // Default identity mapping when Domain and DTO are the same shape (subclasses override).
    return bridgeTypes<Domain, DTO>(domain);
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
    return bridgeTypes<DTO, Domain>(dto);
  }
}

/**
 * Mapper composition utility for complex multi-step transformations
 */
export const compose = <A, B, C, PAB = A, PBC = B>(
  mapperAB: Mapper<A, PAB, B>,
  mapperBC: Mapper<B, PBC, C>
): Mapper<A, PAB, C> => {
  return new (class extends Mapper<A, PAB, C> {
    toPersistence(a: A): PAB {
      return mapperAB.toPersistence(a);
    }
    toDomain(p: PAB): A {
      return mapperAB.toDomain(p);
    }
    toDTO(a: A): C {
      return mapperBC.toDTO(bridgeTypes<A, B>(a));
    }
  })();
};