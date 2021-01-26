import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { queryParam } from 'ember-parachute/decorators';

export default class AnalysisController extends Controller {
  @tracked msPerPixel = 5000;
}
