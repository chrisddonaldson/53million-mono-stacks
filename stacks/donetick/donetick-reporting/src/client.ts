/**
 * DoneTick API Client
 * Client for interacting with the DoneTick API
 */

import { Chore, DoneTickConfig, DoneTickError } from './types.js';
import { logger } from './logger.js';

export class DoneTickClient {
  private config: DoneTickConfig;

  constructor(config: DoneTickConfig) {
    if (!config.url) {
      throw new DoneTickError('DoneTick URL is required');
    }
    if (!config.accessToken) {
      throw new DoneTickError('Access token is required');
    }

    this.config = {
      url: config.url.endsWith('/') ? config.url.slice(0, -1) : config.url,
      accessToken: config.accessToken,
    };

    logger.debug('DoneTick client initialized', { url: this.config.url });
  }

  /**
   * Fetches all chores from the DoneTick API
   * @returns Promise resolving to an array of chores
   * @throws DoneTickError if the request fails
   */
  async getAllChores(): Promise<Chore[]> {
    const url = `${this.config.url}/eapi/v1/chore`;
    logger.info('Fetching all chores from DoneTick API');
    logger.debug('Request URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          secretkey: this.config.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(`API request failed with status ${response.status}`, { errorText });
        throw new DoneTickError(
          `Failed to fetch chores: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const responseText = await response.text();
        logger.error('API returned non-JSON response', {
          contentType,
          statusCode: response.status,
          responsePreview: responseText.substring(0, 200),
        });
        throw new DoneTickError(
          `Failed to fetch chores: API returned ${contentType} instead of JSON`,
          response.status,
        );
      }

      const data = await response.json();

      // Handle both array response and wrapped response formats
      const chores = Array.isArray(data) ? data : (data as { res?: unknown }).res || [];

      if (!Array.isArray(chores)) {
        logger.error('Invalid API response format', { data });
        throw new DoneTickError('Invalid response format from API');
      }

      logger.info(`Successfully fetched ${chores.length} chores`);
      logger.debug('Chores data:', chores);

      return chores;
    } catch (error) {
      if (error instanceof DoneTickError) {
        throw error;
      }

      logger.error('Unexpected error fetching chores', { error });

      if (error instanceof Error) {
        throw new DoneTickError(`Failed to fetch chores: ${error.message}`, undefined, error);
      }

      throw new DoneTickError('An unknown error occurred', undefined, error);
    }
  }

  /**
   * Fetches a specific chore by ID
   * @param choreId - The ID of the chore to fetch
   * @returns Promise resolving to the chore
   * @throws DoneTickError if the request fails
   */
  async getChore(choreId: number): Promise<Chore> {
    const url = `${this.config.url}/eapi/v1/chore/${choreId}`;
    logger.info(`Fetching chore with ID: ${choreId}`);
    logger.debug('Request URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          secretkey: this.config.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(`API request failed with status ${response.status}`, { errorText });
        throw new DoneTickError(
          `Failed to fetch chore: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const responseText = await response.text();
        logger.error('API returned non-JSON response', {
          contentType,
          statusCode: response.status,
          responsePreview: responseText.substring(0, 200),
        });
        throw new DoneTickError(
          `Failed to fetch chore: API returned ${contentType} instead of JSON`,
          response.status,
        );
      }

      const data = (await response.json()) as Chore;
      logger.info(`Successfully fetched chore ${choreId}`);
      logger.debug('Chore data:', data);

      return data;
    } catch (error) {
      if (error instanceof DoneTickError) {
        throw error;
      }

      logger.error('Unexpected error fetching chore', { error });

      if (error instanceof Error) {
        throw new DoneTickError(`Failed to fetch chore: ${error.message}`, undefined, error);
      }

      throw new DoneTickError('An unknown error occurred', undefined, error);
    }
  }

  /**
   * Updates a chore with partial data
   * @param choreId - The ID of the chore to update
   * @param updates - Partial chore data to update
   * @returns Promise resolving to the updated chore
   * @throws DoneTickError if the request fails
   */
  async updateChore(choreId: number, updates: Partial<Chore>): Promise<Chore> {
    const url = `${this.config.url}/eapi/v1/chore/${choreId}`;
    logger.info(`Updating chore with ID: ${choreId}`);
    logger.debug('Request URL:', url);
    logger.debug('Request method: PUT');
    logger.debug('Update data:', updates);

    // Validate that name is provided (required by API)
    if (!updates.name) {
      throw new DoneTickError(
        'Name is required when updating a chore. Please include the chore name in the update.',
      );
    }

    // Map fields to API expected format
    // Note: The API requires Name to always be present
    const apiRequest: Record<string, unknown> = {
      Name: updates.name,
    };
    if (updates.description !== undefined) apiRequest.Description = updates.description;
    if (updates.nextDueDate !== undefined) apiRequest.DueDate = updates.nextDueDate;

    logger.debug('API request body:', apiRequest);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          secretkey: this.config.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequest),
      });

      logger.debug('Response status:', response.status);
      logger.debug('Response content-type:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error(`API request failed with status ${response.status}`, { errorText });
        throw new DoneTickError(
          `Failed to update chore: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const responseText = await response.text();
        logger.error('API returned non-JSON response', {
          contentType,
          statusCode: response.status,
          responsePreview: responseText.substring(0, 200),
        });
        throw new DoneTickError(
          `Failed to update chore: API returned ${contentType} instead of JSON`,
          response.status,
        );
      }

      const data = (await response.json()) as Chore;
      logger.info(`Successfully updated chore ${choreId}`);
      logger.debug('Updated chore data:', data);

      return data;
    } catch (error) {
      if (error instanceof DoneTickError) {
        throw error;
      }

      logger.error('Unexpected error updating chore', { error });

      if (error instanceof Error) {
        throw new DoneTickError(`Failed to update chore: ${error.message}`, undefined, error);
      }

      throw new DoneTickError('An unknown error occurred', undefined, error);
    }
  }
}
