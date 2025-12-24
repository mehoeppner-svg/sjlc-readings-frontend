require 'json'
require 'date'

module Jekyll
  class DailyReadingsGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      # Find all readings.json files
      Dir.glob(File.join(site.source, 'years', '*', 'readings.json')).each do |json_file|
        year = File.basename(File.dirname(json_file))

        begin
          data = JSON.parse(File.read(json_file))
        rescue JSON::ParserError => e
          Jekyll.logger.warn "DailyReadings:", "Could not parse #{json_file}: #{e.message}"
          next
        end

        readings = data['readings'] || []

        readings.each_with_index do |reading, idx|
          date = reading['date']
          fragment_path = File.join(site.source, 'years', year, 'daily_readings', "#{date}_reading.html")

          next unless File.exist?(fragment_path)

          # Calculate prev/next dates
          date_obj = Date.parse(date)
          prev_date = (date_obj - 1).strftime('%Y-%m-%d')
          next_date = (date_obj + 1).strftime('%Y-%m-%d')

          # Create page with metadata
          page = ReadingPage.new(
            site,
            year,
            date,
            reading,
            File.read(fragment_path),
            prev_date,
            next_date
          )
          site.pages << page
        end
      end
    end
  end

  class ReadingPage < Page
    def initialize(site, year, date, reading, content, prev_date, next_date)
      @site = site
      @base = site.source
      @dir = "years/#{year}/daily_readings"
      @name = "#{date}_reading.html"

      self.process(@name)
      self.data = {
        'layout' => 'reading',
        'title' => reading['passage'],
        'date' => date,
        'passage' => reading['passage'],
        'collection' => reading['collection'],
        'theme' => reading['theme'],
        'prev_date' => prev_date,
        'next_date' => next_date,
        'og_title' => "#{reading['passage']} - Daily Reading",
        'og_description' => "Read #{reading['passage']} - Daily Bible Readings from St. John Lutheran Church",
        'og_image' => "/years/#{year}/images/#{date}_verse_card.webp",
        'og_type' => 'article'
      }
      self.content = content
    end
  end
end
