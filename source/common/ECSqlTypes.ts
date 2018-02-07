/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { Id64 } from "@bentley/bentleyjs-core/lib/Id";
import { BentleyStatus } from "@bentley/bentleyjs-core/lib/Bentley";
import { IModelError } from "./IModelError";

/** Describes the different data types an ECSQL value can be of. */
export enum ECSqlValueType {
  Blob = 1,
  Boolean = 2,
  DateTime = 3,
  Double = 4,
  Geometry = 5,
  Id = 6,
  Int = 7,
  Int64 = 8,
  Point2d = 9,
  Point3d = 10,
  String = 11,
  Navigation = 12,
  Struct = 13,
  PrimitiveArray = 14,
  StructArray = 15}

/** An ECSQL DateTime value.
 * It is returned from ECSQL SELECT for date time properties or expressions.
 * It is also used to bind a date time value to a date time ECSQL parameter.
 */
export class DateTime {
  /** Contructor
   * @param isoString ISO 8601 formatted date time string
   */
   public constructor(public isoString: string) {}

   public isValid(): boolean { return this.isoString !== undefined && this.isoString.length > 0; }
}

/** An ECSQL Navigation value.
 * It is returned from ECSQL SELECT for navigation properties.
 */
export class NavigationValue {
  /** Contructor
   * @param id ECInstanceId of the related instance
   * @param relClassName Fully qualified class name of the relationship backing the Navigation property
   */
   public constructor(public id: Id64, public relClassName?: string) {}
   public isValid(): boolean { return this.id !== undefined && this.id!.isValid(); }
}

/** An ECSQL Navigation value which can be bound to a navigation property ECSQL parameter
 */
export class NavigationBindingValue extends NavigationValue {
  /** Contructor
   * @param id ECInstanceId of the related instance
   * @param relClassName Fully qualified class name of the relationship backing the Navigation property
   * @param relClassTableSpace Table space where the relationship's schema is persisted. This is only required
   * if other ECDb files are attached to the primary one. In case a schema exists in more than one of the files,
   * pass the table space to disambiguate.
   */
   public constructor(public id: Id64, public relClassName?: string, public relClassTableSpace?: string) { super(id, relClassName); }
}

/** An ECSQL Blob value.
 * It is returned from ECSQL SELECT for Blob properties or expressions.
 * It is also used to bind a Blob value to a Blob ECSQL parameter.
 */
export class Blob {
  /** Contructor
   * @param value BLOB formatted as Base64 string
   */
   public constructor(public base64: string) {}

   public isValid(): boolean { return this.base64 !== undefined; }
}

/** Defines the ECSQL system properties. */
export enum ECSqlSystemProperty {
  ECInstanceId,
  ECClassId,
  SourceECInstanceId,
  SourceECClassId,
  TargetECInstanceId,
  TargetECClassId,
  NavigationId,
  NavigationRelClassId,
  PointX,
  PointY,
  PointZ }

/** Utility to format ECProperties according to the iModelJs formatting rules. */
export class ECJsNames {
  /** Formats the specified ECProperty according to the iModelJs formatting rules.
   *  @remarks Formatting rules:
   *    * System properties:
   *        - [[ECSqlSystemProperty.ECInstanceId]]: id
   *        - [[ECSqlSystemProperty.ECClassId]]: className
   *        - [[ECSqlSystemProperty.SourceECInstanceId]]: sourceId
   *        - [[ECSqlSystemProperty.SourceECClassId]]: sourceClassName
   *        - [[ECSqlSystemProperty.TargetECInstanceId]]: targetId
   *        - [[ECSqlSystemProperty.TargetECClassId]]: targetClassName
   *        - [[ECSqlSystemProperty.NavigationId]]: id
   *        - [[ECSqlSystemProperty.NavigationRelClassId]]: relClassName
   *        - [[ECSqlSystemProperty.PointX]]: x
   *        - [[ECSqlSystemProperty.PointY]]: y
   *        - [[ECSqlSystemProperty.PointZ]]: z
   *    * Ordinary properties: first character is lowered.
   *  @param ecProperty Either the property name as defined in the ECSchema for regular ECProperties.
   *         Or an ECSqlSystemProperty value for ECSQL system properties
   */
  public static toJsName(ecProperty: ECSqlSystemProperty | string): string {
    if (typeof(ecProperty) === "string")
      return ECJsNames.lowerFirstChar(ecProperty);

    switch (ecProperty) {
      case ECSqlSystemProperty.ECInstanceId:
      case ECSqlSystemProperty.NavigationId:
        return "id";
      case ECSqlSystemProperty.ECClassId:
        return "className";
      case ECSqlSystemProperty.SourceECInstanceId:
        return "sourceId";
      case ECSqlSystemProperty.SourceECClassId:
        return "sourceClassName";
      case ECSqlSystemProperty.TargetECInstanceId:
        return "targetId";
      case ECSqlSystemProperty.TargetECClassId:
        return "targetClassName";
      case ECSqlSystemProperty.NavigationRelClassId:
        return "relClassName";
      case ECSqlSystemProperty.PointX:
        return "x";
      case ECSqlSystemProperty.PointY:
        return "y";
      case ECSqlSystemProperty.PointZ:
        return "z";
      default:
       throw new IModelError(BentleyStatus.ERROR, `Unknown ECSqlSystemProperty enum value ${ecProperty}.`);
    }
  }

  private static lowerFirstChar(name: string): string {
    return name[0].toLowerCase() + name.substring(1);
  }
}
