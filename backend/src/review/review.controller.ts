import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('monthly')
  getMonthlyReview(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reviewService.getMonthlyReview(year, month);
  }

  @Get('trend')
  getReviewTrend(@Query('months', ParseIntPipe) months?: number) {
    return this.reviewService.getReviewTrend(months || 6);
  }
}
