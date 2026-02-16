import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

interface FormDataJsonParserOptions {
  /**
   * Name of the field that contains the entire JSON payload.
   * If provided in the request body as a string, it will be parsed and used
   * as the final DTO input. Defaults to 'payload'.
   */
  payloadField?: string;

  /**
   * Individual fields within the body that should be treated as JSON strings.
   * Each field listed here will be parsed independently (useful for nested objects).
   */
  jsonFields?: string[];
}

@Injectable()
export class FormDataJsonParserPipe implements PipeTransform<any> {
  constructor(private readonly options: FormDataJsonParserOptions = {}) {}

  transform(value: any, metadata: any) {
    console.log('[FormDataJsonParserPipe] Transform called');
    console.log('[FormDataJsonParserPipe] Value:', value);
    console.log('[FormDataJsonParserPipe] Metadata:', metadata);
    
    if (!value) {
      console.log('[FormDataJsonParserPipe] Value is empty');
      return value;
    }

    const payloadField = this.options.payloadField ?? 'payload';
    const jsonFields = this.options.jsonFields ?? [];

    let parsedValue = value;

    if (value[payloadField]) {
      if (typeof value[payloadField] !== 'string') {
        throw new BadRequestException(`${payloadField} must be a JSON string`);
      }

      try {
        parsedValue = JSON.parse(value[payloadField]);
      } catch (error) {
        throw new BadRequestException(`Invalid JSON in ${payloadField}`);
      }
    } else {
      // Clone to avoid mutating the original reference
      parsedValue = { ...value };

      // Parse JSON fields BEFORE validation
      jsonFields.forEach((field) => {
        if (parsedValue[field] !== undefined && parsedValue[field] !== null) {
          // If it's already an object/array, skip parsing
          if (
            typeof parsedValue[field] === 'object' &&
            !Array.isArray(parsedValue[field])
          ) {
            return; // Already parsed
          }

          // If it's a string, parse it
          if (typeof parsedValue[field] === 'string') {
            try {
              const trimmed = parsedValue[field].trim();
              if (trimmed) {
                parsedValue[field] = JSON.parse(trimmed);
              }
            } catch (error) {
              throw new BadRequestException(
                `Invalid JSON in ${field}: ${error.message}`,
              );
            }
          }
        }
      });
    }

    return parsedValue;
  }
}
